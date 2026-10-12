#!/usr/bin/env python3
"""Prepare Floreix for the final domain without breaking GitHub Pages previews.

Safe to rerun: all transformations are idempotent.
Does not configure the custom domain or edit Hostalia DNS.
"""
from __future__ import annotations
import html as html_lib
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
FINAL = "https://floreix.com"
PREVIEW = "https://maite-terapia.github.io/floreix-new/"
PAGES = {
    "index.html": ("/", "/es/"),
    "es/index.html": ("/", "/es/"),
    "about/index.html": ("/about/", "/es/sobre-nosotros/"),
    "es/sobre-nosotros/index.html": ("/about/", "/es/sobre-nosotros/"),
    "psicoterapia/index.html": ("/psicoterapia/", "/es/psicoterapia/"),
    "es/psicoterapia/index.html": ("/psicoterapia/", "/es/psicoterapia/"),
    "terapia-a-la-natura/index.html": ("/terapia-a-la-natura/", "/es/terapia-en-la-naturaleza/"),
    "es/terapia-en-la-naturaleza/index.html": ("/terapia-a-la-natura/", "/es/terapia-en-la-naturaleza/"),
    "metodologia/index.html": ("/metodologia/", "/es/metodologia/"),
    "es/metodologia/index.html": ("/metodologia/", "/es/metodologia/"),
    "contact/index.html": ("/contact/", "/es/contacto/"),
    "es/contacto/index.html": ("/contact/", "/es/contacto/"),
    "privacy-policy/index.html": ("/privacy-policy/", "/es/terminos-y-condiciones/"),
    "es/terminos-y-condiciones/index.html": ("/privacy-policy/", "/es/terminos-y-condiciones/"),
}
VALID_ROUTES = {val for pair in PAGES.values() for val in pair}
KNOWN_FILE_ROOTS = ("assets/", "sitemap.xml", "robots.txt", "404.html")
UPDATED = []

def replace_tag_attr(tag: str, key: str, value: str):
    pat = re.compile(rf'(\b{re.escape(key)}\s*=\s*)(["\'])(.*?)\2', re.I | re.S)
    if pat.search(tag):
        return pat.sub(lambda m: m.group(1) + m.group(2) + html_lib.escape(value,quote=True) + m.group(2), tag, count=1)
    return tag[:-1] + f' {key}="{html_lib.escape(value,quote=True)}">'

def replace_meta_tag(data: str, *, prefix: str, key: str, value: str, new_tag: str):
    pat = re.compile(r"<" + prefix + r"\b[^>]*>", re.I | re.S)
    for m in pat.finditer(data):
        tag = m.group(0)
        if re.search(rf'\b(?:name|property|rel)\s*=\s*(["\']){re.escape(key)}\1', tag, re.I):
            attr = "href" if prefix == "link" else "content"
            return data[:m.start()] + replace_tag_attr(tag,attr,value) + data[m.end():]
    return data.replace("</head>", new_tag + "\n</head>", 1)

def localize_route_href(match, depth):
    attr, quotechar, raw, close = match.groups()
    if raw.startswith(("#", "mailto:", "tel:", "javascript:", "//")):
        return match.group(0)
    url = html_lib.unescape(raw)
    p = None
    if url.startswith(PREVIEW):
        p = url[len(PREVIEW):]
    elif url.startswith("https://floreix.com/") or url.startswith("http://floreix.com/"):
        p = url.split("floreix.com/",1)[1]
    elif url.startswith("/"):
        p = url.lstrip("/")
    elif url.startswith("https://maite-terapia.github.io/floreix/"):
        p = url[len("https://maite-terapia.github.io/floreix/"):]
    if p is None:
        return match.group(0)
    base = p.split("#",1)[0].split("?",1)[0]
    normalized = "/" + base
    if normalized != "/" and normalized.rstrip("/") + "/" in VALID_ROUTES:
        pass
    elif normalized != "/" and not any(base.startswith(x) for x in KNOWN_FILE_ROOTS):
        return match.group(0)
    if base.startswith(("wp-content/", "wp-includes/")):
        return match.group(0)
    final = "../"*depth + p
    return attr + quotechar + html_lib.escape(final, quote=True) + quotechar + close

def update_page(relative: str, pair: tuple[str,str]):
    file = ROOT/relative
    s = file.read_text(encoding="utf-8")
    old = s
    depth = len(Path(relative).parts)-1
    route = "/" + relative.removesuffix("index.html")
    if route == "//": route="/"
    final_url = FINAL + route
    ca, es = pair
    # SEO: final domain is the single canonical; keep preview links relative and working.
    s = replace_meta_tag(s,prefix="link",key="canonical",value=final_url,
                         new_tag=f'<link rel="canonical" href="{final_url}">')
    s = replace_meta_tag(s,prefix="meta",key="og:url",value=final_url,
                         new_tag=f'<meta property="og:url" content="{final_url}">')
    for lang,link in (("ca",FINAL+ca),("es",FINAL+es)):
        pat=re.compile(r'<link\b[^>]*\bhreflang\s*=\s*(["\'])'+lang+r'\1[^>]*>',re.I|re.S)
        m=pat.search(s)
        if m:
            s=s[:m.start()]+replace_tag_attr(m.group(0),"href",link)+s[m.end():]
        else:
            s=s.replace("</head>",f'<link rel="alternate" hreflang="{lang}" href="{link}">\n</head>',1)
    # Social images must have absolute URLs, not page-relative paths.
    def image_meta(m):
        tag=m.group(0)
        if not re.search(r'\b(?:property|name)\s*=\s*(["\'])(?:og:image|twitter:image)\1',tag,re.I):return tag
        c=re.search(r'\bcontent\s*=\s*(["\'])(.*?)\1',tag,re.I|re.S)
        if not c:return tag
        src=html_lib.unescape(c.group(2))
        if src.startswith(("https://","http://")):
            if src.startswith(PREVIEW):src=FINAL+"/"+src[len(PREVIEW):]
            return replace_tag_attr(tag,"content",src)
        if src.startswith("../") or src.startswith("assets/") or src.startswith("/assets/"):
            suffix=src
            while suffix.startswith("../"):suffix=suffix[3:]
            suffix=suffix.lstrip("/")
            return replace_tag_attr(tag,"content",FINAL+"/"+suffix)
        return tag
    s=re.sub(r'<meta\b[^>]*>',image_meta,s,flags=re.I|re.S)
    # Rebuild staging navigation as relative paths, so it also works at floreix.com.
    # Only URL-bearing href/src attributes, not scripts or canonical tags.
    pat=re.compile(r'(\b(?:href|src)\s*=\s*)(["\'])(.*?)\2()',re.I|re.S)
    # Avoid touching SEO, hreflang, plugin assets and iframe embed URLs.
    def attr_on_tag(m):
        tag=m.group(0)
        if tag.lower().startswith(("<link","<meta")):
            return tag
        return re.sub(r'(\b(?:href|src)\s*=\s*)(["\'])(.*?)\2',lambda x:
          localize_route_href(_AttrMatch(x), depth),tag,flags=re.I|re.S)
    class_attr_re=re.compile(r'<(?:a|img|script)\b[^>]*>',re.I|re.S)
    # Work only on tags; preserve WordPress CSS and other inline text exactly.
    def localized_tag(m):
        tag=m.group(0)
        return re.sub(r'(\b(?:href|src)\s*=\s*)(["\'])(.*?)\2',
            lambda x: route_url_attr(x,depth), tag, flags=re.I|re.S)
    def route_url_attr(x,depth):
        orig=x.group(3)
        if orig.startswith(("#","mailto:","tel:","javascript:","//")):return x.group(0)
        raw=html_lib.unescape(orig)
        if raw.startswith(PREVIEW):
            tail=raw[len(PREVIEW):]
        elif raw.startswith(("https://floreix.com/","http://floreix.com/")):
            tail=raw.split("floreix.com/",1)[1]
        elif raw.startswith("https://maite-terapia.github.io/floreix/"):
            tail=raw[len("https://maite-terapia.github.io/floreix/"):]
        elif raw.startswith("/") and not raw.startswith("//"):
            tail=raw[1:]
        else:return x.group(0)
        clean=tail.split("#",1)[0].split("?",1)[0]
        cleanroute="/"+clean.lstrip("/")
        if cleanroute!="/" and cleanroute.rstrip("/")+"/" not in VALID_ROUTES:
            if not any(clean.startswith(k) for k in KNOWN_FILE_ROOTS):return x.group(0)
        if clean.startswith(("wp-content/","wp-includes/")):return x.group(0)
        return x.group(1)+x.group(2)+html_lib.escape("../"*depth+tail,quote=True)+x.group(2)
    s=class_attr_re.sub(localized_tag,s)
    # Old RSS and WordPress oEmbed discovery endpoints will no longer exist.
    s=re.sub(r'<link\b[^>]*(?:type\s*=\s*["\']application/(?:rss\+xml|json\+oembed)["\']|type\s*=\s*["\']text/xml\+oembed["\'])[^>]*>\s*',"",s,flags=re.I)
    # Remove stale WPForms front-end JS and plugin CSS (including missing times icon).
    s=re.sub(r'<script\b[^>]*\bsrc\s*=\s*["\'][^"\']*(?:wpforms-lite|googlesitekit-events-provider-wpforms)[^"\']*["\'][^>]*>\s*</script>\s*',"",s,flags=re.I|re.S)
    s=re.sub(r'<link\b[^>]*\bhref\s*=\s*["\'][^"\']*wpforms-lite[^"\']*["\'][^>]*>\s*',"",s,flags=re.I|re.S)
    # Replace /assets/site.js on the standalone legal page (this file never existed).
    s=re.sub(r'<script\b[^>]*\bsrc\s*=\s*["\']/assets/site\.js["\'][^>]*>\s*</script>',"",s,flags=re.I|re.S)
    # Google Maps: retain working original embeds, give directions links as a fallback.
    if "contact" in relative and "metodologia" not in relative:
        language="es" if relative.startswith("es/") else "ca"
        labels={
          "ca":("Veure la ubicació a Google Maps","Obrir el mapa de Valldoreix"),
          "es":("Ver ubicación en Google Maps","Abrir mapa de Valldoreix")
        }
        locations=("Carrer Joan Güell, 220, Barcelona, España","Carrer Violetes, Valldoreix, Barcelona, España")
        count=0
        def wrap_map(m):
            nonlocal count
            content=m.group(0)
            if "maps.google.com/maps" not in content:return content
            idx=min(count,1);count+=1
            if "floreix-map-link" in content:return content
            directions="https://www.google.com/maps/search/?api=1&query="+quote(locations[idx],safe="")
            return content + f'<p class="floreix-map-link"><a href="{html_lib.escape(directions,quote=True)}" target="_blank" rel="noopener noreferrer">{labels[language][idx]}</a></p>'
        s=re.sub(r'<iframe\b[^>]*\bsrc=["\']https://maps\.google\.com/maps[^>]*>\s*</iframe>',wrap_map,s,flags=re.I|re.S)
        if "floreix-map-link" in s and "floreix-map-fallback-styles" not in s:
            css='''<style id="floreix-map-fallback-styles">
.elementor-widget-google_maps .elementor-custom-embed iframe{display:block;width:100%;min-height:300px;border:0;border-radius:16px}
.floreix-map-link{margin:10px 0 0;text-align:center;font-size:13px;line-height:1.5}
.floreix-map-link a{color:#214638;text-decoration:underline;text-underline-offset:3px}
@media(max-width:600px){.elementor-widget-google_maps .elementor-custom-embed iframe{min-height:260px}}
</style>'''
            s=s.replace("</head>",css+"\n</head>",1)
    # Hide legacy social icons in Contact: Twitter, Instagram and YouTube
    # were all placeholder href="#" links, not working profiles.
    if relative in ("contact/index.html","es/contacto/index.html"):
        if 'id="floreix-hide-placeholder-social-links"' not in s:
            s=s.replace("</head>",'<style id="floreix-hide-placeholder-social-links">\n.elementor-element[data-id="c7d043c"].elementor-widget-social-icons{display:none!important}\n</style>\n</head>',1)
    # The original WordPress Catalan legal page sent Spanish visitors to the
    # Spanish homepage instead of the translated legal page.
    if relative=="privacy-policy/index.html":
        s=s.replace('<a href="../es/" hreflang="es-ES"',
                    '<a href="../es/terminos-y-condiciones/" hreflang="es-ES"')
    if relative.startswith("es/terminos"):
        # This standalone legal page does not load the premium layout; preserve its own styles.
        pass
    if s!=old:
        file.write_text(s,encoding="utf-8")
        UPDATED.append(relative)
    # Guarantees: no stale GitHub URL in a canonical/alternate or a root image path.
    if f'rel="canonical" href="{final_url}"' not in s:raise ValueError("canonical not updated: "+relative)
    if s.count('hreflang="ca"')<1 or s.count('hreflang="es"')<1:
        raise ValueError("Missing language alternates: "+relative)
    return s

def update_premium_js():
    p=ROOT/"assets/premium.js"
    s=p.read_text(encoding="utf-8")
    original="""  const BASE = 'https://maite-terapia.github.io/floreix-new/';
  const ASSET_BASE = ['127.0.0.1','localhost'].includes(location.hostname) ? '/' : BASE;"""
    replacement="""  // The project preview is served under /floreix-new/. At floreix.com the
  // same files live at the root. Never fetch images from the retired hostname.
  const BASE = location.hostname === 'maite-terapia.github.io' ? '/floreix-new/' : '/';
  const ASSET_BASE = BASE;"""
    if original in s:
        s=s.replace(original,replacement)
        p.write_text(s,encoding="utf-8")
        UPDATED.append("assets/premium.js")
    elif "location.hostname === 'maite-terapia.github.io'" not in s:
        raise ValueError("Unexpected premium.js asset-base logic")

def update_sitemap():
    p=ROOT/"sitemap.xml"
    parts=['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for relative,(ca,es) in PAGES.items():
        route="/"+relative.removesuffix("index.html")
        if route=="//":route="/"
        parts.append('  <url>')
        parts.append(f'    <loc>{FINAL+route}</loc>')
        parts.append(f'    <xhtml:link rel="alternate" hreflang="ca" href="{FINAL+ca}"/>')
        parts.append(f'    <xhtml:link rel="alternate" hreflang="es" href="{FINAL+es}"/>')
        parts.append('  </url>')
    parts.append('</urlset>')
    p.write_text("\n".join(parts)+"\n",encoding="utf-8")
    (ROOT/"robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {FINAL}/sitemap.xml\n",encoding="utf-8")
    UPDATED.extend(["robots.txt","sitemap.xml"])

def update_404():
    p=ROOT/"404.html"
    p.write_text('''<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pàgina no trobada · Floreix</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f7f3;color:#193b31;font-family:system-ui,-apple-system,sans-serif}
main{padding:30px;max-width:560px;text-align:center}h1{font-weight:500;font-size:clamp(28px,5vw,44px)}
a{display:inline-block;padding:13px 24px;border-radius:24px;background:#193b31;color:white;text-decoration:none}
p{line-height:1.7}
</style></head><body><main><h1>Pàgina no trobada</h1><p>Aquesta pàgina no existeix o s’ha mogut.</p>
<p><a id="back-home" href="/">Torna a l’inici · Volver al inicio</a></p></main>
<script>if(location.hostname==="maite-terapia.github.io")document.getElementById("back-home").href="/floreix-new/";</script>
</body></html>
''',encoding="utf-8")
    UPDATED.append("404.html")

def main():
    for rel,pair in PAGES.items():update_page(rel,pair)
    update_premium_js()
    update_sitemap()
    update_404()
    print("CUTOVER_PREPARATION_UPDATED",",".join(UPDATED),flush=True)

if __name__=="__main__":main()
