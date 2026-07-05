// mobile nav
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
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

  function resize(){
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    const count = Math.floor((w*h)/16000);
    stars = Array.from({length: count}, () => ({
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*9 + 5,
      rot: Math.random()*Math.PI,
      spin: (Math.random()-0.5)*0.15,
      vx: (Math.random()-0.5)*0.12,
      vy: -(Math.random()*0.1 + 0.02),
      alpha: Math.random()*0.4 + 0.45,
      depth: Math.random()*0.85 + 0.15,
      color: COLORS[Math.random() < 0.86 ? 0 : (Math.random() < 0.5 ? 1 : 2)]
    }));
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

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetX = ((e.clientX - rect.left)/rect.width - 0.5)*2;
    targetY = ((e.clientY - rect.top)/rect.height - 0.5)*2;
  });
  canvas.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

  let t = 0;
  function draw(){
    if(!reduceMotion){
      mouseX += (targetX - mouseX)*0.05;
      mouseY += (targetY - mouseY)*0.05;
    }
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      if(!reduceMotion){
        s.x += s.vx;
        s.y += s.vy;
        if(s.y < -s.r){ s.y = h + s.r; s.x = Math.random()*w; }
        if(s.x < -s.r) s.x = w + s.r;
        if(s.x > w + s.r) s.x = -s.r;
      }
      const px = s.x + mouseX*maxShift*s.depth;
      const py = s.y + mouseY*maxShift*s.depth;
      const rotation = reduceMotion ? s.rot : s.rot + t*s.spin*0.02;
      drawStar(px, py, s.r, rotation, s.alpha, s.color);
    }
    t++;
    if(!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
});