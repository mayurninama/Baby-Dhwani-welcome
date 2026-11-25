#!/usr/bin/env python3
"""Bundle index.html, styles.css, script.js, and WebP-compressed assets into a single shareable HTML file."""

import base64
import io
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SHARE_DIR = ROOT / "share"
OUT_FILE = SHARE_DIR / "baby-dhwani-invite.html"


def encode_asset_data_uri(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".png":
        im = Image.open(path).convert("RGBA")
        buf = io.BytesIO()
        im.save(buf, format="WEBP", quality=88, method=6)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        return f"data:image/webp;base64,{b64}"
    if ext in {".jpg", ".jpeg"}:
        data = path.read_bytes()
        b64 = base64.b64encode(data).decode("ascii")
        return f"data:image/jpeg;base64,{b64}"
    raise ValueError(f"Unsupported asset extension: {path}")


def build_bundle() -> None:
    SHARE_DIR.mkdir(parents=True, exist_ok=True)

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    js = (ROOT / "script.js").read_text(encoding="utf-8")

    # Encode all top-level assets (skip assets/raw)
    asset_map: dict[str, str] = {}
    for p in sorted(ASSETS.iterdir()):
        if p.is_file():
            rel = f"assets/{p.name}"
            asset_map[rel] = encode_asset_data_uri(p)

    # Replace asset references inside CSS and HTML
    for rel, uri in asset_map.items():
        css = css.replace(rel, uri)
        html = html.replace(rel, uri)

    # Inline CSS and JS cleanly
    html = re.sub(
        r'<link\s+rel="stylesheet"\s+href="styles\.css"\s*/?>',
        lambda _: f"<style>\n{css}\n</style>",
        html,
        count=1,
    )
    html = re.sub(
        r'<script\s+src="script\.js"\s*>\s*</script>',
        lambda _: f"<script>\n{js}\n</script>",
        html,
        count=1,
    )

    # Sanity check: ensure no leftover relative asset/css/js references remain
    leftover = re.findall(r'(?:src|href|url\()["\']?(assets/|styles\.css|script\.js)', html)
    if leftover:
        raise RuntimeError(f"Found un-inlined local references: {leftover}")

    OUT_FILE.write_text(html, encoding="utf-8")
    size_kb = OUT_FILE.stat().st_size / 1024.0
    print(f"Created standalone shareable HTML: {OUT_FILE} ({size_kb:.1f} KB, {len(asset_map)} assets inlined)")


if __name__ == "__main__":
    build_bundle()
