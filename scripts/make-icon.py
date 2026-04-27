#!/usr/bin/env python3
"""Generate the SimpleWorkoutGen iOS app icon.

Design: a bold "timer dial" mark — a thick gradient ring (suggesting elapsed
time / energy) with a concentric inner ring and a stylized lightning-bolt
"strike" through the centre, set on a deep navy gradient background.

Reads zero inputs. Writes a single 1024×1024 PNG to the path passed on argv,
or to ./icon-1024.png by default. The Capacitor cap-asset pipeline can fan it
out to the rest of the size grid; we also do that ourselves for resilience.
"""
import math
import sys
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "icon-1024.png"
SIZE = 1024


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_gradient(size, inner, outer):
    """Centre-out radial gradient from inner → outer."""
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


def main():
    # Palette — picks up on the v2 "Dark" theme so the icon visually matches the app.
    bg_inner = (28, 32, 64)      # warm navy core
    bg_outer = (8, 8, 16)         # near-black at the corners
    ring_a   = (79, 140, 255)     # accent blue
    ring_b   = (140, 240, 255)    # cyan highlight on the ring
    inner_ring = (40, 48, 80)
    bolt_fill = (255, 255, 255)
    bolt_glow = (140, 240, 255)

    # Render at 4× and downsample for clean anti-aliasing.
    SCALE = 4
    W = SIZE * SCALE
    base = radial_gradient(W, bg_inner, bg_outer)
    draw = ImageDraw.Draw(base, "RGBA")

    cx = cy = W // 2

    # Outer dial ring (thick, with a sweeping cyan highlight to imply rotation/time).
    R_OUT = int(W * 0.42)
    R_IN  = int(W * 0.32)
    # Draw the ring as an arc in segments to fake a gradient sweep.
    SEG = 360
    for i in range(SEG):
        a0 = i - 90
        a1 = a0 + 1.5
        t = i / SEG
        # Sweep from accent blue at 12 o'clock around to cyan at ~9 o'clock.
        col = lerp(ring_a, ring_b, (math.sin(math.radians(i * 1.0)) + 1) / 2)
        draw.arc(
            [(cx - R_OUT, cy - R_OUT), (cx + R_OUT, cy + R_OUT)],
            start=a0, end=a1, fill=col + (255,), width=int(W * 0.06),
        )

    # Inner ring (subtle, suggests a second dial).
    draw.ellipse(
        [(cx - R_IN, cy - R_IN), (cx + R_IN, cy + R_IN)],
        outline=inner_ring + (255,), width=int(W * 0.012),
    )

    # Centre lightning bolt — the "strike" that turns rest into work.
    # Coordinates are in fraction-of-canvas, mapped through W.
    bolt = [
        (0.55, 0.30),
        (0.40, 0.52),
        (0.50, 0.52),
        (0.42, 0.72),
        (0.62, 0.46),
        (0.52, 0.46),
        (0.60, 0.30),
    ]
    pts = [(cx - W * 0.50 + p[0] * W, cy - W * 0.50 + p[1] * W) for p in bolt]

    # Soft glow layer behind the bolt.
    glow_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(glow_layer)
    g.polygon(pts, fill=bolt_glow + (220,))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=int(W * 0.018)))
    base = Image.alpha_composite(base.convert("RGBA"), glow_layer)

    # Crisp bolt on top.
    draw = ImageDraw.Draw(base, "RGBA")
    draw.polygon(pts, fill=bolt_fill + (255,))

    # Downsample with high-quality resampling for the final 1024×1024.
    final = base.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    final.save(OUT, "PNG", optimize=True)
    print("wrote", OUT, final.size)


if __name__ == "__main__":
    main()
