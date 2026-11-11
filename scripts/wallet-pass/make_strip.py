"""Draws the Wallet pass banner (strip): styled QR on the left, logo and contact lines on the right.
Run from this folder."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1125, 432
FONT = '/System/Library/Fonts/HelveticaNeue.ttc'
EDGE = 15

bg = Image.new('RGBA', (W, H), (EDGE,) * 3 + (255,))
d = ImageDraw.Draw(bg)

qs = H - 48
qr = Image.open('../../card/qr-white-on-black.png').convert('RGB').resize((qs, qs), Image.LANCZOS)
bg.paste(qr, (28, 24))

x0 = 28 + qs + 30
rw = W - x0 - 24
lg = Image.open('../../ert-logo-light.png').convert('RGBA')
lw = rw - 20
lh = int(lg.height * lw / lg.width)
y = 22
bg.alpha_composite(lg.resize((lw, lh), Image.LANCZOS), (x0 + 10, y))
y += lh + 22

font = ImageFont.truetype(FONT, 37, index=0)
for line in ['EricRogersTechnology.com', 'Eric@EricRogersTechnology.com', '260.207.4335']:
    w = d.textlength(line, font=font)
    d.text((x0 + (rw - w) / 2, y), line, font=font, fill=(228, 228, 228))
    y += 48

out = bg.convert('RGB')
out.save('src/strip@3x.png')
out.resize((750, 288), Image.LANCZOS).save('src/strip@2x.png')
out.resize((375, 144), Image.LANCZOS).save('src/strip.png')
