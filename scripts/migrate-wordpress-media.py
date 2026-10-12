#!/usr/bin/env python3
"""One-time WordPress media migration for the static Floreix site.

Only replaces references after a downloaded image is decoded and saved locally.
Original photo families are deduplicated across Spanish and Catalan pages.
Run from the repo root; safe to repeat. Requires requests and Pillow.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import io
import json
import re
import time
import unicodedata
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlsplit, unquote

import requests
from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "assets" / "media"
MEDIA.mkdir(parents=True, exist_ok=True)
HTML_FILES = [ROOT / "index.html"] + sorted(ROOT.glob("*/index.html")) + sorted(ROOT.glob("es/*/index.html"))
HTML_FILES = [p for p in dict.fromkeys(HTML_FILES) if p.exists()]
JS_FILE = ROOT / "assets" / "premium.js"
FILES = HTML_FILES + [JS_FILE]
EXTENSIONS = "png|jpe?g|webp|gif|svg|avif"
URL_PATTERN = re.compile(
    rf"https?://(?:www\.)?floreix\.com/wp-content/uploads/[^\s\"'<>\\(),;]+?\.(?:{EXTENSIONS})",
    re.IGNORECASE,
)
DIM_PATTERN = re.compile(r"-([0-9]{2,4})x([0-9]{2,4})(?=\.(?:png|jpe?g|webp|gif|avif)$)", re.IGNORECASE)
SESSION_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Referer": "https://floreix.com/",
}

def canonical(url: str) -> str:
    return DIM_PATTERN.sub("", url)

def dimensions_hint(url: str) -> int:
    m = DIM_PATTERN.search(url)
    return int(m.group(1)) * int(m.group(2)) if m else 10**12

def slugify(stem: str) -> str:
    stem = unicodedata.normalize("NFKD", unquote(stem))
    stem = stem.encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", stem).strip("-")[:55] or "image"

def download_family(item):
    family, urls = item
    candidates = sorted(set(urls) | {family}, key=lambda u: (-dimensions_hint(u), u))
    last_error = None
    data = None
    selected = ""
    # Original is tried first. If it is missing, choose the largest responsive variant.
    for url in candidates:
        try:
            response = requests.get(url, headers=SESSION_HEADERS, timeout=(12, 35), allow_redirects=True)
            response.raise_for_status()
            if len(response.content) > 24 * 1024 * 1024:
                raise ValueError("Image exceeds safety limit")
            if response.headers.get("Content-Type", "").split(";")[0].strip() == "text/html":
                raise ValueError("Got HTML instead of an image")
            data = response.content
            selected = url
            if url.lower().endswith(".svg"):
                if b"<svg" not in data[:1200]:
                    raise ValueError("Not a valid SVG")
            else:
                with Image.open(io.BytesIO(data)) as verify:
                    verify.verify()
            break
        except (Exception) as exc:
            last_error = f"{url}: {exc}"
            data = None
    if data is None:
        return family, None, {"error": str(last_error), "candidates": candidates}
    original_filename = Path(urlsplit(family).path).name
    root_name = Path(original_filename).stem
    is_svg = selected.lower().endswith(".svg")
    is_favicon = "favicon" in root_name.lower()
    is_logo = any(x in root_name.lower() for x in ("logo", "masterbrand", "captura-de-pantalla", "avatar"))
    keep_png = is_favicon or (is_logo and Path(original_filename).suffix.lower() == ".png")
    suffix = ".svg" if is_svg else ".png" if keep_png else ".webp"
    dest_name = f"{hashlib.sha256(family.encode()).hexdigest()[:10]}-{slugify(root_name)}{suffix}"
    target = MEDIA / dest_name

    if is_svg:
        target.write_bytes(data)
        size = {"width": None, "height": None, "format": "SVG"}
    else:
        with Image.open(io.BytesIO(data)) as im:
            image = ImageOps.exif_transpose(im)
            animated = getattr(image, "is_animated", False)
            if animated:
                target = MEDIA / (dest_name.rsplit(".", 1)[0] + ".gif")
                target.write_bytes(data)
            else:
                max_side = 2200 if not is_logo else 1800
                if max(image.size) > max_side:
                    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
                has_alpha = image.mode in ("RGBA", "LA") or ("transparency" in image.info)
                image = image.convert("RGBA" if has_alpha else "RGB")
                if keep_png:
                    image.save(target, "PNG", optimize=True)
                else:
                    image.save(target, "WEBP", quality=86, method=6)
            size = {"width": image.width, "height": image.height, "format": suffix.lstrip(".").upper()}
    return family, dest_name if not animated else target.name, {
        "original": selected, "bytes": target.stat().st_size, **size
    }

def run() -> None:
    originals = {p: p.read_text(encoding="utf-8") for p in FILES}
    families = defaultdict(list)
    for src in originals.values():
        for match in URL_PATTERN.finditer(src):
            url = match.group()
            families[canonical(url)].append(url)
    print(f"WordPress media: {sum(len(URL_PATTERN.findall(s)) for s in originals.values())} URL occurrences, "
          f"{sum(len(set(u)) for u in families.values())} unique variants, {len(families)} image families.",
          flush=True)
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for family, name, meta in pool.map(download_family, families.items()):
            results[family] = (name, meta)
            print(f"  {'OK ' if name else 'FAIL'} {family.split('/')[-1]} -> {name or meta['error']}", flush=True)
    failed = [k for k, (n, _) in results.items() if not n]
    if failed:
        print(f"WARNING: {len(failed)} image families could not be downloaded", flush=True)

    # JS URLs are overridden at runtime by premium.js, so preserve ASSET_BASE
    # to make the paths work on both the project URL and the future root domain.
    js = originals[JS_FILE]
    def replace_js(m):
        url = m.group(2)
        name = results[canonical(url)][0]
        return f"ASSET_BASE + 'assets/media/{name}'" if name else m.group(0)
    js = re.sub(
        rf"(['\"])(https?://floreix\.com/wp-content/uploads/[^\s\"'<>\\(),;]+?\.(?:{EXTENSIONS}))\1",
        replace_js, js, flags=re.IGNORECASE
    )

    changes = {}
    total_replacements = 0
    for p in HTML_FILES:
        text = originals[p]
        prefix = "../" * len(p.parent.relative_to(ROOT).parts)
        def replace_html(m):
            nonlocal total_replacements
            url = m.group()
            name = results[canonical(url)][0]
            if name:
                total_replacements += 1
            return f"{prefix}assets/media/{name}" if name else url

        text = URL_PATTERN.sub(replace_html, text)

        # WordPress srcset variants now share one high-quality local file.
        # Remove misleading width descriptors and deprecated lazy-data variants.
        def cleanup_img(m):
            tag = m.group()
            if "assets/media/" not in tag:
                return tag
            tag = re.sub(r"\s(?:data-)?srcset\s*=\s*([\"']).*?\1", "", tag, flags=re.I | re.S)
            tag = re.sub(r"\s(?:data-)?sizes\s*=\s*([\"']).*?\1", "", tag, flags=re.I | re.S)
            if not re.search(r"\bdecoding\s*=", tag, flags=re.I):
                tag = tag[:-1] + ' decoding="async">'
            return tag
        text = re.sub(r"<img\b[^>]*>", cleanup_img, text, flags=re.I | re.S)
        changes[p] = text
    changes[JS_FILE] = js

    for p, text in changes.items():
        if text != originals[p]:
            p.write_text(text, encoding="utf-8")
    remaining = {
        p.relative_to(ROOT).as_posix(): len(URL_PATTERN.findall(text))
        for p, text in changes.items() if URL_PATTERN.search(text)
    }
    # Fallback to WordPress-origin content must never be silently reported as completed.
    report = {
        "image_families": len(families),
        "original_url_variants": sum(len(set(u)) for u in families.values()),
        "imported_families": len(families) - len(failed),
        "missing_families": failed,
        "rewritten_html_references": total_replacements,
        "remaining_wordpress_image_urls": remaining,
        "assets": {
            family: {"file": name, **meta} for family, (name, meta) in sorted(results.items())
        },
    }
    (ROOT / "assets" / "media-manifest.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("MEDIA_MIGRATION_SUMMARY " + json.dumps({
        k: v for k, v in report.items() if k != "assets"
    }, ensure_ascii=False), flush=True)
    if failed or remaining:
        raise SystemExit("Incomplete migration: please check the manifest and resolve the missing images")

if __name__ == "__main__":
    run()
