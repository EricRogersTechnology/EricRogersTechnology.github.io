"""Draws the Wallet poster background and the header logo. Run from this folder.
Wallet crops the card to ~0.71 aspect, shows only the top ~10% when the pass sits in the stack, and covers the
bottom ~25% with a gray fade, so: logo in the top 9%, QR above 72% of the height."""
import math
from PIL import Image, ImageDraw, ImageOps

W, H = 1080, 1400
cx, cy = W / 2, 330

bg = Image.new('RGB', (W, H))
px = bg.load()
for y in range(H):
    for x in range(W):
        d = math.hypot(x - cx, (y - cy) * 0.9) / 760
        v = 13 + 24 * max(0.0, 1 - d) ** 1.7
        px[x, y] = (int(v),) * 3
bg = bg.convert('RGBA')
rings = Image.new('RGBA', (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(rings)
for r in range(120, 1500, 150):
    rd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 11), width=2)
bg = Image.alpha_composite(bg, rings)
d = ImageDraw.Draw(bg)

# logo in the strip that stays visible in the Wallet stack
lg = Image.open('../../ert-logo-light.png').convert('RGBA')
lw = 360
lh = int(lg.height * lw / lg.width)
bg.alpha_composite(lg.resize((lw, lh), Image.LANCZOS), ((W - lw) // 2, 14))

# orbit divider
y = 190
r = 11
d.line([(260, y), (W // 2 - 34, y)], fill=(255, 255, 255, 70), width=2)
d.line([(W // 2 + 34, y), (W - 260, y)], fill=(255, 255, 255, 70), width=2)
d.ellipse([W // 2 - r, y - r, W // 2 + r, y + r], outline=(235, 235, 235), width=3)
d.ellipse([W // 2 - 3, y - 3, W // 2 + 3, y + 3], fill=(235, 235, 235))
d.ellipse([W // 2 + 7, y - 17, W // 2 + 16, y - 8], fill=(255, 255, 255))

# styled white-on-black QR, made transparent so no box shows
qs = 640
qr = Image.open('../../card/qr-white-on-black.png').convert('L').resize((qs, qs), Image.LANCZOS)
white = Image.new('RGBA', (qs, qs), (255, 255, 255, 255))
white.putalpha(qr.point(lambda v: 0 if v < 40 else min(255, (v - 40) * 255 // 175)))
bg.alpha_composite(white, ((W - qs) // 2, 270))

out = bg.convert('RGB')
w3 = 1170
h3 = round(H * w3 / W)
big = out.resize((w3, h3), Image.LANCZOS)
big.save('src/background@3x.png')
big.resize((780, round(h3 * 780 / 1170)), Image.LANCZOS).save('src/background@2x.png')
big.resize((390, round(h3 * 390 / 1170)), Image.LANCZOS).save('src/background.png')
out.save('/tmp/poster-v3.png')

for name, h in [('logo.png', 50), ('logo@2x.png', 100), ('logo@3x.png', 150)]:
    lg.resize((int(lg.width * h / lg.height), h), Image.LANCZOS).save('src/' + name)
