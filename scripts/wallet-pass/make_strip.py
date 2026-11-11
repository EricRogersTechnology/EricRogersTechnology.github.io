"""Draws the Wallet pass banner (strip) from the site logo. Run from this folder."""
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1125, 432
FONT = '/System/Library/Fonts/HelveticaNeue.ttc'
EDGE = 15

bg = Image.new('RGB', (W, H), (EDGE,) * 3)
px = bg.load()
cx, cy = W / 2, H * 0.42
for y in range(H):
    for x in range(W):
        d = math.hypot((x - cx) / 1.0, (y - cy) * 1.5) / (W * 0.5)
        v = EDGE + 26 * max(0.0, 1 - d) ** 1.7
        px[x, y] = (int(v),) * 3
bg = bg.convert('RGBA')
d = ImageDraw.Draw(bg)

lg = Image.open('../../ert-logo-light.png').convert('RGBA')
lw = 560; lh = int(lg.height * lw / lg.width)
y = 8
bg.alpha_composite(lg.resize((lw, lh), Image.LANCZOS), ((W - lw) // 2, y))
y += lh + 8

# orbit divider
r = 12
d.line([(300, y + r), (W // 2 - 34, y + r)], fill=(255, 255, 255, 70), width=2)
d.line([(W // 2 + 34, y + r), (W - 300, y + r)], fill=(255, 255, 255, 70), width=2)
d.ellipse([W // 2 - r, y, W // 2 + r, y + 2 * r], outline=(235, 235, 235), width=3)
d.ellipse([W // 2 - 3, y + r - 3, W // 2 + 3, y + r + 3], fill=(235, 235, 235))
d.ellipse([W // 2 + 7, y - 6, W // 2 + 17, y + 4], fill=(255, 255, 255))
y += 2 * r + 14

font = ImageFont.truetype(FONT, 52, index=0)
for line in ['EricRogersTechnology.com', 'Eric@EricRogersTechnology.com', '260.207.4335']:
    w = d.textlength(line, font=font)
    d.text(((W - w) / 2, y), line, font=font, fill=(228, 228, 228))
    y += 58
print('bottom', y)

out = bg.convert('RGB')
out.save('src/strip@3x.png')
out.resize((750, 288), Image.LANCZOS).save('src/strip@2x.png')
out.resize((375, 144), Image.LANCZOS).save('src/strip.png')
out.save('/tmp/strip-new.png')
