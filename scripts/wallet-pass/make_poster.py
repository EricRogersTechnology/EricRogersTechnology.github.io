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

W, H = 1170, 1755  # 2:3 at 3x. Wallet crops it to the card and covers the bottom ~25% with a gray fade,
                   # so everything important stays between y=120 and y=1250.
BGC = (14, 14, 16)  # matches the QR image background so no box shows
bg = Image.new('RGBA', (W, H), BGC + (255,))

lw = 700
lh = int(lg.height * lw / lg.width)
bg.alpha_composite(lg.resize((lw, lh), Image.LANCZOS), ((W - lw) // 2, 130))

qs = 780
qr = Image.open('../../card/qr-white-on-black.png').convert('RGB').resize((qs, qs), Image.LANCZOS)
bg.paste(qr, ((W - qs) // 2, 130 + lh + 70))

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
p['backgroundColor'] = 'rgb(14, 14, 16)'
p['generic'] = {'primaryFields': [], 'secondaryFields': [], 'auxiliaryFields': [], 'backFields': back}
p['posterGeneric'] = {'headerFields': [], 'footerFields': [], 'backFields': back}
json.dump(p, open('src/pass.json', 'w'), indent=2, ensure_ascii=False)
open('src/pass.json', 'a').write('\n')
