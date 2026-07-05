"""One-off tool to generate small JPEG thumbnails for the landing page bubbles.

The landing page renders photos inside 64px circular bubbles (max ~140px
once scaled), but was loading the same multi-megabyte, full-resolution
PNG/JPG files used by the full-size gallery on explore.html (some over 3MB).
This script downsamples every image in assets/photos into
assets/photos/thumbs/ so landing.js can load small files instead. It
processes the whole folder (not just landing.js's current PHOTO_FILES list)
so it doesn't need to be kept in sync by hand whenever that list changes.
"""

import os
from PIL import Image

BASE = os.path.join(os.path.dirname(__file__), "..", "assets", "photos")
OUT_DIR = os.path.join(BASE, "thumbs")
os.makedirs(OUT_DIR, exist_ok=True)

MAX_DIM = 320
QUALITY = 72

AVATAR_FILE = os.path.join(os.path.dirname(__file__), "..", "assets", "me.jpg")
AVATAR_MAX_DIM = 480
AVATAR_QUALITY = 80

IMAGE_EXTS = {".jpg", ".jpeg", ".png"}


def make_thumb(src_path, dst_path, max_dim, quality):
    with Image.open(src_path) as im:
        im = im.convert("RGB")
        w, h = im.size
        scale = max_dim / max(w, h)
        if scale < 1:
            im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
        im.save(dst_path, "JPEG", quality=quality, optimize=True)
    before = os.path.getsize(src_path)
    after = os.path.getsize(dst_path)
    print(f"{os.path.basename(src_path)}: {before // 1024}KB -> {after // 1024}KB")


total_before = 0
total_after = 0
for name in sorted(os.listdir(BASE)):
    stem, ext = os.path.splitext(name)
    if ext.lower() not in IMAGE_EXTS:
        continue
    src = os.path.join(BASE, name)
    if not os.path.isfile(src):
        continue
    dst = os.path.join(OUT_DIR, f"{stem}.jpg")
    make_thumb(src, dst, MAX_DIM, QUALITY)
    total_before += os.path.getsize(src)
    total_after += os.path.getsize(dst)

make_thumb(AVATAR_FILE, os.path.join(OUT_DIR, "me-avatar.jpg"), AVATAR_MAX_DIM, AVATAR_QUALITY)

print(f"\nTotal: {total_before // 1024}KB -> {total_after // 1024}KB")
