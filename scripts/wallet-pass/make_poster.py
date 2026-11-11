"""Draws the Wallet poster background (contact lines + styled QR) and the header logo.
Run from this folder."""
import math
from PIL import Image, ImageDraw, ImageFont

FONT = '/System/Library/Fonts/HelveticaNeue.ttc'
EDGE = 15

lg = Image.open('../../ert-logo-light.png').convert('RGBA')
for name, h in [('logo.png', 50), ('logo@2x.png', 100), ('logo@3x.png', 150)]:
    w = int(lg.width * h / lg.height)
    lg.resize((w, h), Image.LANCZOS).save('src/' + name)

W, H = 1170, 1755  # 2:3 at 3x
bg = Image.new('RGB', (W, H), (EDGE,) * 3)
px = bg.load()
cx, cy = W / 2, H * 0.62
for y in range(H):
    for x in range(W):
        d = math.hypot(x - cx, (y - cy) * 0.8) / (W * 0.75)
        v = EDGE + 22 * max(0.0, 1 - d) ** 1.8
        px[x, y] = (int(v),) * 3
bg = bg.convert('RGBA')
d = ImageDraw.Draw(bg)

def centered(text, y, font, fill):
    w = d.textlength(text, font=font)
    d.text(((W - w) / 2, y), text, font=font, fill=fill)

# contact block, below the logo that Wallet draws at the top
y = 330
r = 16
d.line([(210, y + r), (W // 2 - 44, y + r)], fill=(255, 255, 255, 70), width=2)
d.line([(W // 2 + 44, y + r), (W - 210, y + r)], fill=(255, 255, 255, 70), width=2)
d.ellipse([W // 2 - r, y, W // 2 + r, y + 2 * r], outline=(235, 235, 235), width=3)
d.ellipse([W // 2 - 3, y + r - 3, W // 2 + 3, y + r + 3], fill=(235, 235, 235))
d.ellipse([W // 2 + 9, y - 8, W // 2 + 21, y + 4], fill=(255, 255, 255))
y += 2 * r + 34
font = ImageFont.truetype(FONT, 54, index=0)
for line in ['EricRogersTechnology.com', 'Eric@EricRogersTechnology.com', '260.207.4335']:
    centered(line, y, font, (232, 232, 232))
    y += 72

# styled white-on-black QR, large at the bottom
qs = 940
qr = Image.open('../../card/qr-white-on-black.png').convert('RGB').resize((qs, qs), Image.LANCZOS)
bg.paste(qr, ((W - qs) // 2, H - qs - 90))

out = bg.convert('RGB')
out.save('src/background@3x.png')
out.resize((780, 1170), Image.LANCZOS).save('src/background@2x.png')
out.resize((390, 585), Image.LANCZOS).save('src/background.png')
out.save('/tmp/poster-v2.png')

import json
p = json.load(open('src/pass.json'))
old = p.pop('storeCard', None) or p.pop('generic', None) or {}
back = old.get('backFields', [])
for k in ('eventTicket', 'storeCard', 'preferredStyleSchemes', 'semantics'):
    p.pop(k, None)
p['barcodes'] = []
p['backgroundColor'] = 'rgb(%d, %d, %d)' % ((EDGE,) * 3)
p['generic'] = {'primaryFields': [], 'secondaryFields': [], 'auxiliaryFields': [], 'backFields': back}
p['posterGeneric'] = {'headerFields': [], 'footerFields': [], 'backFields': back}
json.dump(p, open('src/pass.json', 'w'), indent=2, ensure_ascii=False)
open('src/pass.json', 'a').write('\n')
