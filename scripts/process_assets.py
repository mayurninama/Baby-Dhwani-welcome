#!/usr/bin/env python3
"""Process raw watercolor illustrations into edge-cleaned transparent PNGs + QA sheet."""

from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets"


def remove_white_bg_bfs(img: Image.Image, lum_thresh: float = 236.0, spread_thresh: float = 24.0) -> Image.Image:
    """Exterior-only BFS flood fill to remove white background while preserving interior creams/whites."""
    rgba = img.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    lum = 0.299 * r + 0.587 * g + 0.114 * b
    spread = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    is_bg_cand = (lum >= lum_thresh) & (spread <= spread_thresh)

    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    # Seed from all 4 image edges
    for x in range(w):
        if is_bg_cand[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if is_bg_cand[h - 1, x] and not visited[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if is_bg_cand[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if is_bg_cand[y, w - 1] and not visited[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg_cand[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # Build base alpha: 0 for exterior bg, 1 for interior
    alpha = np.where(visited, 0.0, 1.0).astype(np.float32)

    # Dilate exterior mask by 3px to find anti-aliased boundary pixels
    boundary = visited.copy()
    for _ in range(3):
        padded = np.pad(boundary, 1, mode="constant", constant_values=False)
        boundary = (
            padded[:-2, 1:-1]
            | padded[2:, 1:-1]
            | padded[1:-1, :-2]
            | padded[1:-1, 2:]
            | boundary
        )

    edge_band = boundary & (~visited)
    # Soft ramp alpha on edge pixels based on darkness below near-white ceiling (250)
    edge_strength = np.clip((248.0 - lum) / 48.0, 0.0, 1.0)
    # Keep slightly tinted watercolor edge strokes opaque enough
    tint_boost = np.clip((spread - 8.0) / 24.0, 0.0, 1.0)
    edge_alpha = np.maximum(edge_strength, tint_boost * 0.85)
    alpha[edge_band] = np.minimum(alpha[edge_band], edge_alpha[edge_band])

    # White halo decontamination on semi-transparent boundary pixels
    decontam_mask = (alpha > 0.04) & (alpha < 0.99)
    safe_a = np.maximum(alpha, 0.08)
    for c in range(3):
        ch = arr[:, :, c]
        decontam = np.clip((ch - (1.0 - alpha) * 255.0) / safe_a, 0.0, 255.0)
        ch[decontam_mask] = decontam[decontam_mask]
        ch[alpha <= 0.02] = 0.0
        arr[:, :, c] = ch

    arr[:, :, 3] = np.clip(alpha * 255.0, 0.0, 255.0)
    return Image.fromarray(arr.astype(np.uint8), mode="RGBA")


def crop_alpha(img: Image.Image, pad: int = 8) -> Image.Image:
    """Crop RGBA image tightly to non-transparent pixels plus padding."""
    arr = np.array(img)
    ys, xs = np.where(arr[:, :, 3] > 6)
    if len(ys) == 0:
        return img
    y0 = max(0, int(ys.min()) - pad)
    y1 = min(arr.shape[0], int(ys.max()) + 1 + pad)
    x0 = max(0, int(xs.min()) - pad)
    x1 = min(arr.shape[1], int(xs.max()) + 1 + pad)
    return img.crop((x0, y0, x1, y1))


def resize_max(img: Image.Image, max_dim: int) -> Image.Image:
    w, h = img.size
    if max(w, h) <= max_dim:
        return img
    scale = max_dim / float(max(w, h))
    return img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.Resampling.LANCZOS)


def soft_elliptical_extract(img: Image.Image, box: tuple[int, int, int, int], feather: int = 26) -> Image.Image:
    """Crop a sub-region and softly feather alpha near crop edges that touch non-transparent pixels."""
    sub = img.crop(box).convert("RGBA")
    arr = np.array(sub, dtype=np.float32)
    h, w, _ = arr.shape
    yy, xx = np.mgrid[0:h, 0:w]
    dist_edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)).astype(np.float32)
    mask = np.clip(dist_edge / float(feather), 0.0, 1.0)
    # Apply smoothstep near border so no sharp straight cut line ever appears
    mask = mask * mask * (3.0 - 2.0 * mask)
    arr[:, :, 3] = arr[:, :, 3] * mask
    return Image.fromarray(arr.astype(np.uint8), mode="RGBA")


def remove_white_bg_balloon(img: Image.Image) -> Image.Image:
    """Remove exterior white background AND enclosed pure-white rope/string gaps without touching creams."""
    rgba = img.convert("RGBA")
    arr = np.array(rgba, dtype=np.float32)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    lum = 0.299 * r + 0.587 * g + 0.114 * b
    min_c = np.minimum(np.minimum(r, g), b)
    max_c = np.maximum(np.maximum(r, g), b)
    spread = max_c - min_c

    # Exterior background threshold (generous for anti-aliased watercolor edges)
    is_ext_cand = (lum >= 242.0) & (spread <= 15.0)
    # Strict pure-white threshold for enclosed rope/string/leaf gaps
    is_pure_white = (min_c >= 247.0) & (spread <= 7.0)

    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    # 1. Seed from all 4 edges for exterior flood-fill
    for x in range(w):
        if is_ext_cand[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if is_ext_cand[h - 1, x] and not visited[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if is_ext_cand[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if is_ext_cand[y, w - 1] and not visited[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_ext_cand[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # 2. Seed enclosed pure-white pockets (between ropes, strings, leaves) outside dome/puppy/placard interiors
    q2 = deque()
    for y in range(int(h * 0.15), int(h * 0.88), 3):
        for x in range(int(w * 0.22), int(w * 0.85), 3):
            # Skip interior of balloon dome, puppy head/chest/paws, and placard
            in_dome = (0.31 * w <= x <= 0.69 * w) and (0.10 * h <= y <= 0.55 * h)
            in_puppy = (0.42 * w <= x <= 0.59 * w) and (0.59 * h <= y <= 0.83 * h)
            in_placard = (0.55 * w <= x <= 0.72 * w) and (0.61 * h <= y <= 0.76 * h)
            if in_dome or in_puppy or in_placard:
                continue
            if not visited[y, x] and is_pure_white[y, x]:
                visited[y, x] = True
                q2.append((y, x))

    while q2:
        cy, cx = q2.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and (min_c[ny, nx] >= 243.0 and spread[ny, nx] <= 10.0):
                visited[ny, nx] = True
                q2.append((ny, nx))

    alpha = np.where(visited, 0.0, 1.0).astype(np.float32)

    # 3px boundary feather + white halo decontamination
    boundary = visited.copy()
    for _ in range(3):
        padded = np.pad(boundary, 1, mode="constant", constant_values=False)
        boundary = (
            padded[:-2, 1:-1]
            | padded[2:, 1:-1]
            | padded[1:-1, :-2]
            | padded[1:-1, 2:]
            | boundary
        )

    edge_band = boundary & (~visited)
    edge_strength = np.clip((249.0 - lum) / 44.0, 0.0, 1.0)
    tint_boost = np.clip((spread - 6.0) / 20.0, 0.0, 1.0)
    edge_alpha = np.maximum(edge_strength, tint_boost * 0.85)
    alpha[edge_band] = np.minimum(alpha[edge_band], edge_alpha[edge_band])

    decontam_mask = (alpha > 0.04) & (alpha < 0.99)
    safe_a = np.maximum(alpha, 0.08)
    for c in range(3):
        ch = arr[:, :, c]
        decontam = np.clip((ch - (1.0 - alpha) * 255.0) / safe_a, 0.0, 255.0)
        ch[decontam_mask] = decontam[decontam_mask]
        ch[alpha <= 0.02] = 0.0
        arr[:, :, c] = ch

    arr[:, :, 3] = np.clip(alpha * 255.0, 0.0, 255.0)
    return Image.fromarray(arr.astype(np.uint8), mode="RGBA")


def process_all() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # Remove deprecated fallback derived floral assets if present
    for old in ("balloon-bouquet-left.png", "balloon-bouquet-right.png", "basket-mini-florals.png"):
        old_p = OUT / old
        if old_p.exists():
            old_p.unlink()

    # 1. Paper texture -> normalized warm #f6f1e7 JPEG
    paper = Image.open(RAW / "paper-texture.jpg").convert("RGB")
    paper = paper.resize((900, 1200), Image.Resampling.LANCZOS)
    p_arr = np.array(paper, dtype=np.float32)
    target_mean = np.array([246.0, 241.0, 231.0], dtype=np.float32)
    cur_mean = p_arr.mean(axis=(0, 1))
    p_arr = np.clip(p_arr + (target_mean - cur_mean) * 0.75, 0, 255).astype(np.uint8)
    Image.fromarray(p_arr, mode="RGB").save(OUT / "paper-texture.jpg", quality=84, optimize=True)

    # 2. Finalized Hero Balloon (user illustration)
    balloon_raw = Image.open(RAW / "balloon-hero.jpg")
    balloon_rgba = remove_white_bg_balloon(balloon_raw)
    # Record crop box to map raw placard coords accurately into cropped balloon-hero.png
    b_arr = np.array(balloon_rgba)
    bys, bxs = np.where(b_arr[:, :, 3] > 6)
    pad = 8
    bx0 = max(0, int(bxs.min()) - pad)
    by0 = max(0, int(bys.min()) - pad)
    bx1 = min(b_arr.shape[1], int(bxs.max()) + 1 + pad)
    by1 = min(b_arr.shape[0], int(bys.max()) + 1 + pad)
    balloon_cropped = balloon_rgba.crop((bx0, by0, bx1, by1))
    balloon_final = resize_max(balloon_cropped, 940)
    balloon_final.save(OUT / "balloon-hero.png", optimize=True)

    # Compute placard center in cropped balloon coordinates
    # Raw placard center is roughly (0.635*1024, 0.684*1024) -> (650, 700)
    cw, ch_dim = bx1 - bx0, by1 - by0
    print(f"balloon-hero crop box: ({bx0},{by0})..({bx1},{by1}) -> final size {balloon_final.size}")
    print(f"Placard raw approx box in cropped %: left={(576-bx0)/cw*100:.1f}%, top={(645-by0)/ch_dim*100:.1f}%, w={(715-576)/cw*100:.1f}%, h={(754-645)/ch_dim*100:.1f}%")

    # 3. Cloud
    cloud_raw = Image.open(RAW / "cloud.jpg")
    cloud = resize_max(crop_alpha(remove_white_bg_bfs(cloud_raw, lum_thresh=241.0, spread_thresh=18.0)), 480)
    cloud.save(OUT / "cloud.png", optimize=True)

    # 4. Crest garland wing
    garland_raw = Image.open(RAW / "crest-garland-wing.jpg")
    garland_full = remove_white_bg_bfs(garland_raw, lum_thresh=236.0, spread_thresh=22.0)
    garland = resize_max(crop_alpha(garland_full), 760)
    garland.save(OUT / "crest-garland-wing.png", optimize=True)

    # 5. Derived crest-top-florals
    top_crop = soft_elliptical_extract(garland_full, (135, 645, 555, 1085), feather=38)
    top_rot = top_crop.rotate(-52, resample=Image.Resampling.BICUBIC, expand=True)
    top_florals = resize_max(crop_alpha(top_rot), 440)
    top_florals.save(OUT / "crest-top-florals.png", optimize=True)

    # 6. Slice extras-sheet.jpg (1024x1024)
    extras = Image.open(RAW / "extras-sheet.jpg")
    ew, eh = extras.size

    bow_raw = extras.crop((0, 0, ew // 2, int(eh * 0.48)))
    pink_bow = resize_max(crop_alpha(remove_white_bg_bfs(bow_raw, lum_thresh=238.0, spread_thresh=22.0)), 480)
    pink_bow.save(OUT / "pink-bow.png", optimize=True)

    bfly_raw = extras.crop((ew // 2, 0, ew, int(eh * 0.48)))
    butterfly = resize_max(crop_alpha(remove_white_bg_bfs(bfly_raw, lum_thresh=238.0, spread_thresh=22.0)), 260)
    butterfly.save(OUT / "butterfly.png", optimize=True)

    ribbon_raw = extras.crop((0, int(eh * 0.47), ew, eh))
    sage_ribbon = resize_max(crop_alpha(remove_white_bg_bfs(ribbon_raw, lum_thresh=240.0, spread_thresh=18.0)), 760)
    sage_ribbon.save(OUT / "sage-ribbon.png", optimize=True)

    # 7. Side-by-side QA preview of balloon-hero.png on #f6f1e7 cream and #a9c0ba sage
    bw, bh = balloon_final.size
    qa = Image.new("RGB", (bw * 2, bh), (246, 241, 231))
    qa.paste((169, 192, 186), (bw, 0, bw * 2, bh))
    qa.paste(balloon_final, (0, 0), balloon_final)
    qa.paste(balloon_final, (bw, 0), balloon_final)
    qa.save("/tmp/dhwani_balloon_qa.png")

    assets_list = [
        "balloon-hero.png",
        "cloud.png",
        "pink-bow.png",
        "butterfly.png",
        "sage-ribbon.png",
        "crest-garland-wing.png",
        "crest-top-florals.png",
        "paper-texture.jpg",
    ]
    print("Processed all assets successfully:")
    for fname in assets_list:
        p = OUT / fname
        im = Image.open(p)
        print(f"  {fname}: {im.size} {im.mode} ({p.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    process_all()
