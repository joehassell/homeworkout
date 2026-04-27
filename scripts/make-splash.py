#!/usr/bin/env python3
"""Generate a 2732×2732 launch screen for the iOS app.

Composition: same dark navy gradient as the icon, with the icon mark scaled to
~24% of the canvas, centered. Matches the in-app dark theme so the launch is
seamless rather than a jarring white flash.
"""
import math
import sys
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "splash-2732.png"
SIZE = 2732


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_gradient(size, inner, outer):
    img = Image.new("RGB", (size, size), outer)
    px = img.load()
    cx = cy = size / 2
    max_d = math.hypot(cx, cy)
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / max_d
            d = max(0.0, min(1.0, d))
            px[x, y] = lerp(inner, outer, d)
    return img


def draw_mark(canvas, cx, cy, R):
    """Draw the same logo mark used in the icon, sized so the outer ring radius is R."""
    ring_a = (79, 140, 255)
    ring_b = (140, 240, 255)
    inner_ring = (40, 48, 80)
    bolt_fill = (255, 255, 255)
    bolt_glow = (140, 240, 255)
    ring_w = int(R * 0.18)
    inner_w = int(R * 0.04)
    R_OUT = R
    R_IN  = int(R * 0.78)

    draw = ImageDraw.Draw(canvas, "RGBA")

    SEG = 360
    for i in range(SEG):
        a0 = i - 90
        a1 = a0 + 1.5
        col = lerp(ring_a, ring_b, (math.sin(math.radians(i * 1.0)) + 1) / 2)
        draw.arc(
            [(cx - R_OUT, cy - R_OUT), (cx + R_OUT, cy + R_OUT)],
            start=a0, end=a1, fill=col + (255,), width=ring_w,
        )

    draw.ellipse(
        [(cx - R_IN, cy - R_IN), (cx + R_IN, cy + R_IN)],
        outline=inner_ring + (255,), width=inner_w,
    )

    bolt_local = [
        (0.55, 0.30),
        (0.40, 0.52),
        (0.50, 0.52),
        (0.42, 0.72),
        (0.62, 0.46),
        (0.52, 0.46),
        (0.60, 0.30),
    ]
    BOLT_R = R * 1.6
    pts = [(cx - BOLT_R / 2 + p[0] * BOLT_R, cy - BOLT_R / 2 + p[1] * BOLT_R) for p in bolt_local]

    glow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(glow_layer)
    g.polygon(pts, fill=bolt_glow + (220,))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=int(R * 0.06)))
    canvas.paste(glow_layer, (0, 0), glow_layer)

    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.polygon(pts, fill=bolt_fill + (255,))


def main():
    bg_inner = (28, 32, 64)
    bg_outer = (8, 8, 16)

    # Render at 2× and downsample.
    SCALE = 2
    W = SIZE * SCALE
    base = radial_gradient(W, bg_inner, bg_outer).convert("RGBA")
    R = int(W * 0.13)  # mark roughly 26% of viewport diameter
    draw_mark(base, W // 2, W // 2, R)

    final = base.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    final.save(OUT, "PNG", optimize=True)
    print("wrote", OUT, final.size)


if __name__ == "__main__":
    main()
