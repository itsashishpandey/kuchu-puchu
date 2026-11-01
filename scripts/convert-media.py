#!/usr/bin/env python3
"""Crop generated 768x1344 images to 9:16 (720x1280) masters + webp outputs."""
import os
from PIL import Image

GEN = "/home/z/my-project/scripts/gen2"
MASTERS = "/home/z/my-project/scripts/masters"
THUMBS = "/home/z/my-project/public/images/thumbs"
PUB = "/home/z/my-project/public/images"
os.makedirs(MASTERS, exist_ok=True)

def to_master(name):
    src = os.path.join(GEN, f"{name}.png")
    im = Image.open(src).convert("RGB")
    w, h = im.size  # 768x1344
    # center-crop to 9:16
    tw = int(h * 9 / 16)  # 756
    if tw <= w:
        x0 = (w - tw) // 2
        im = im.crop((x0, 0, x0 + tw, h))
    else:
        th = int(w * 16 / 9)
        y0 = (h - th) // 2
        im = im.crop((0, y0, w, y0 + th))
    im = im.resize((720, 1280), Image.LANCZOS)
    out = os.path.join(MASTERS, f"{name}.png")
    im.save(out, optimize=True)
    return out

# 16 video thumbnails
for i in range(1, 17):
    name = f"th{i:02d}"
    m = to_master(name)
    Image.open(m).save(os.path.join(THUMBS, f"{name}.webp"), "WEBP", quality=82, method=6)
    print(name, "ok")

# hero / appeal visuals (keep portrait, webp)
for name in ["hero-kids", "upload-kid", "earn-kid"]:
    src = os.path.join(GEN, f"{name}.png")
    im = Image.open(src).convert("RGB")
    im.save(os.path.join(PUB, f"{name}.webp"), "WEBP", quality=84, method=6)
    # also a 9:16 master for potential video use
    to_master(name)
    print(name, "ok")
print("ALL DONE")
