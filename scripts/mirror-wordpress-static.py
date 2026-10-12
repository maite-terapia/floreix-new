#!/usr/bin/env python3
"""Preserve Floreix's old WordPress theme styles, scripts and fonts on GitHub Pages.

Unlike the image importer, this mirrors assets at their existing wp-content/wp-includes
paths. When floreix.com points to GitHub Pages, unchanged absolute stylesheet URLs
still work, and the existing site's layout does not lose its WordPress-era CSS.
"""
from __future__ import annotations

import json
import posixpath
import re
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import requests

ROOT = Path(__file__).resolve().parents[1]
HTML = [ROOT / "index.html"] + list(ROOT.glob("*/index.html")) + list(ROOT.glob("es/*/index.html"))
HTML = list(dict.fromkeys(p for p in HTML if p.exists()))
HOST = "https://floreix.com"
PATH_RE = re.compile(r"https?://(?:www\.)?floreix\.com/(?:wp-content|wp-includes)/[^\s\"'<>\\),;]+", re.I)
SAFE_EXT = {".css", ".js", ".woff", ".woff2", ".ttf", ".eot", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico"}
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36", "Referer": "https://floreix.com/"}
queue = deque()
seen = set()
saved = []
errors = []

def add_url(raw: str):
    raw = raw.replace("&amp;", "&").strip().strip("'\"")
    p = urlsplit(raw)
    if p.scheme not in ("http", "https") or p.netloc.lower() not in ("floreix.com", "www.floreix.com"):
        return
    path = posixpath.normpath(p.path)
    if not path.startswith(("/wp-content/", "/wp-includes/")):
        return
    if Path(path).suffix.lower() not in SAFE_EXT:
        return
    if path in seen:
        return
    seen.add(path)
    queue.append((path, raw))

for page in HTML:
    src = page.read_text(encoding="utf-8")
    for match in PATH_RE.finditer(src):
        add_url(match.group().split("?")[0])

def nested_css_assets(css: str, original_url: str):
    # CSS url(..) references are relative to their original stylesheet.
    for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", css, re.I | re.S):
        raw = match.group(2).strip()
        if not raw or raw.lower().startswith(("data:", "#", "blob:")):
            continue
        add_url(urljoin(original_url, raw))
    for match in re.finditer(r"@import\s+(['\"])(.*?)\1", css, re.I):
        add_url(urljoin(original_url, match.group(2)))

max_files = 170
while queue:
    if len(seen) > max_files:
        raise SystemExit(f"Too many WordPress dependencies ({len(seen)}); aborting for safety")
    path, url = queue.popleft()
    try:
        r = requests.get(url, headers=HEADERS, timeout=(12, 35))
        r.raise_for_status()
        body = r.content
        if not body or len(body) > 12 * 1024 * 1024:
            raise ValueError("Empty or excessively large response")
        if "text/html" in r.headers.get("Content-Type", "") and Path(path).suffix.lower() != ".html":
            raise ValueError("HTML response instead of requested asset")
        if Path(path).suffix.lower() == ".css":
            css = body.decode("utf-8-sig", errors="replace")
            if "<html" in css[:500].lower():
                raise ValueError("HTML error page returned as CSS")
            nested_css_assets(css, url)
        dest = ROOT / path.lstrip("/")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(body)
        saved.append({"path": path, "bytes": len(body)})
        print(f"OK {path} ({len(body)} bytes)", flush=True)
    except Exception as exc:
        errors.append({"path": path, "error": str(exc)})
        print(f"WARN {path}: {exc}", flush=True)

report = {
    "requested": len(seen),
    "mirrored": len(saved),
    "errors": errors,
    "saved": saved,
}
(ROOT / "assets" / "wordpress-static-manifest.json").write_text(
    json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("STATIC_MIRROR_SUMMARY " + json.dumps(
    {"requested": len(seen), "mirrored": len(saved), "errors": errors}, ensure_ascii=False), flush=True)
# Missing files appear explicitly in the manifest, so rollout can be paused if required.
