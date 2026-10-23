#!/usr/bin/env python3
"""Remove the Tasks page from the site:
  - deletes tasks.html
  - removes the Tasks link from nav/footer in every .html file
  - repoints any other link to /tasks (e.g. in rules.html) to /archive
  - removes /tasks from sitemap.xml
Safe to re-run.  Usage: python3 remove_tasks.py [folder] [--dry-run]
"""
import re, sys
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
dry = "--dry-run" in sys.argv
root = Path(args[0] if args else ".")

NAV_LINK = re.compile(r'^[ \t]*<a href="/tasks"[^>]*>Tasks</a>[ \t]*\r?\n', re.M)
OTHER = re.compile(r'href="/tasks(?:\.html)?"')

for f in sorted(root.glob("*.html")):
    if f.name == "tasks.html":
        continue
    t = f.read_text(encoding="utf-8")
    n = NAV_LINK.sub("", t)
    n = OTHER.sub('href="/archive"', n)
    if n != t:
        if not dry:
            f.write_text(n, encoding="utf-8")
        print(("would update:" if dry else "updated:"), f.name)

tasks = root / "tasks.html"
if tasks.exists():
    if not dry:
        tasks.unlink()
    print(("would delete:" if dry else "deleted:"), "tasks.html")

sm = root / "sitemap.xml"
if sm.exists():
    s = sm.read_text(encoding="utf-8")
    n = re.sub(r'[ \t]*<url>\s*<loc>[^<]*/tasks(?:\.html)?</loc>.*?</url>[ \t]*\r?\n?', "", s, flags=re.S)
    if n != s:
        if not dry:
            sm.write_text(n, encoding="utf-8")
        print(("would update:" if dry else "updated:"), "sitemap.xml")