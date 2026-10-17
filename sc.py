#!/usr/bin/env python3
"""Remove "About Us" and "Contact Us" from the top nav (footer links are left alone).
Safe to re-run.  Usage: python3 trim_nav.py [folder] [--dry-run]
"""
import re, sys
from pathlib import Path
args = [a for a in sys.argv[1:] if not a.startswith("--")]
dry = "--dry-run" in sys.argv
root = Path(args[0] if args else ".")
NAV = re.compile(r'(<div class="navlinks" id="navLinks">)(.*?)(</div>)', re.S)
LINK = re.compile(r'^[ \t]*<a href="/(?:about|contact)"[^>]*>(?:About Us|Contact Us)</a>[ \t]*\r?\n', re.M)
for f in sorted(root.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    m = NAV.search(t)
    if not m:
        print("skip (no nav):", f.name); continue
    inner = LINK.sub("", m.group(2))
    if inner == m.group(2):
        print("skip (nothing to remove):", f.name); continue
    if not dry:
        f.write_text(t[:m.start(2)] + inner + t[m.end(2):], encoding="utf-8")
    print(("would update:" if dry else "updated:"), f.name)