// mobile nav
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('open');
      navToggle.textContent = '☰';
      navToggle.setAttribute('aria-expanded', 'false');
    };
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.textContent = isOpen ? '✕' : '☰';
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // starfield canvas — parallax sparkle-star glyphs (same 4-point shape as the logo)
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [];
  let w, h;

  // relative offsets of the 8-point sparkle outline, unit outer radius = 10
  const GLYPH = [
    [0,-10],[2.5,-2.5],[10,0],[2.5,2.5],
    [0,10],[-2.5,2.5],[-10,0],[-2.5,-2.5]
  ];

  const COLORS = ['233,236,245', '124,255,196', '245,196,81'];

  // seeded PRNG (mulberry32) so the ambient star field is reproducible —
  // same seed = same-looking field every time, instead of fully random.
  const SEED = 1337;
  function createRng(seed){
    let s = seed >>> 0;
    return function(){
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createAmbientStars(){
    const count = Math.floor((w*h)/16000);
    const rand = createRng(SEED);
    stars = Array.from({length: count}, () => ({
      xRatio: rand(),
      yRatio: rand(),
      r: rand()*9 + 5,
      rot: rand()*Math.PI,
      spin: (rand()-0.5)*0.15,
      alpha: rand()*0.4 + 0.45,
      depth: rand()*0.85 + 0.15,
      color: COLORS[rand() < 0.86 ? 0 : (rand() < 0.5 ? 1 : 2)]
    }));
  }

  function resize(){
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    if(stars.length === 0) createAmbientStars();
  }

  function drawStar(cx, cy, outerR, rotation, alpha, color){
    const s = outerR/10;
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    ctx.beginPath();
    for(let i=0;i<GLYPH.length;i++){
      const [ox,oy] = GLYPH[i];
      const px = cx + (ox*cos - oy*sin)*s;
      const py = cy + (ox*sin + oy*cos)*s;
      if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${color},${alpha})`;
    ctx.fill();
  }

  // smoothed pointer position, normalized -1..1 from element center
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  const maxShift = 22;

  const heroSection = canvas.parentElement;
  heroSection.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetX = ((e.clientX - rect.left)/rect.width - 0.5)*2;
    targetY = ((e.clientY - rect.top)/rect.height - 0.5)*2;
  });
  heroSection.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

  // click to add a wishing star, with a little grow-in pop
  const MAX_CLICK_STARS = 30;
  heroSection.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    stars.push({
      xRatio: (e.clientX - rect.left)/rect.width,
      yRatio: (e.clientY - rect.top)/rect.height,
      r: Math.random()*8 + 14,
      rot: Math.random()*Math.PI,
      spin: (Math.random()-0.5)*0.25,
      alpha: 0.95,
      depth: 1,
      color: COLORS[Math.floor(Math.random()*COLORS.length)],
      born: t,
      growDuration: 22,
      clicked: true
    });
    const clickedStars = stars.filter(s => s.clicked);
    if(clickedStars.length > MAX_CLICK_STARS){
      stars.splice(stars.indexOf(clickedStars[0]), 1);
    }
    if(reduceMotion) draw();
  });

  let t = 0;
  function draw(){
    if(!reduceMotion){
      mouseX += (targetX - mouseX)*0.05;
      mouseY += (targetY - mouseY)*0.05;
    }
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      let scale = 1;
      if(s.born !== undefined){
        const age = t - s.born;
        scale = age < s.growDuration ? 1 - Math.pow(1 - age/s.growDuration, 3) : 1;
      }
      const px = s.xRatio*w + mouseX*maxShift*s.depth;
      const py = s.yRatio*h + mouseY*maxShift*s.depth;
      const rotation = reduceMotion ? s.rot : s.rot + t*s.spin*0.02;
      drawStar(px, py, s.r*scale, rotation, s.alpha*scale, s.color);
    }
    t++;
    if(!reduceMotion) requestAnimationFrame(draw);
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 120);
  });
  resize();
  draw();
});