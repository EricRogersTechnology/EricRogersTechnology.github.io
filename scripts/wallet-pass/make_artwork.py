"""Draws the Wallet pass poster artwork (portrait) from the site logo. Run from this folder."""
import json, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1125, 1650
FONT = '/System/Library/Fonts/HelveticaNeue.ttc'

# dark radial background with faint rings, like the flyer artwork
bg = Image.new('RGB', (W, H), (10, 10, 10))
px = bg.load()
cx, cy = W / 2, H * 0.40
maxd = math.hypot(W, H) / 2
for y in range(H):
    for x in range(W):
        d = math.hypot(x - cx, y - cy) / maxd
        v = 10 + 30 * max(0.0, 1 - d * 1.35) ** 1.6
        px[x, y] = (int(v), int(v), int(v))
ring = Image.new('RGBA', (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(ring)
for r in range(180, 1500, 170):
    rd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 14), width=2)
bg = Image.alpha_composite(bg.convert('RGBA'), ring)

d = ImageDraw.Draw(bg)
def centered(text, y, size, fill, track=0, idx=0):
    f = ImageFont.truetype(FONT, size, index=idx)
    w = sum(d.textlength(c, font=f) + track for c in text) - track
    x = (W - w) / 2
    for c in text:
        d.text((x, y), c, font=f, fill=fill)
        x += d.textlength(c, font=f) + track

# logo
lg = Image.open('../../ert-logo-light.png').convert('RGBA')
lw = 980; lh = int(lg.height * lw / lg.width)
bg.alpha_composite(lg.resize((lw, lh), Image.LANCZOS), ((W - lw) // 2, 420))

# contact block
y = 420 + lh + 90
for line in ['EricRogersTechnology.com', 'Eric@EricRogersTechnology.com', '260.207.4335']:
    centered(line, y, 52, (222, 222, 222))
    y += 78

# divider with the orbit mark
y += 40
d.line([(150, y), (W // 2 - 50, y)], fill=(255, 255, 255, 60), width=2)
d.line([(W // 2 + 50, y), (W - 150, y)], fill=(255, 255, 255, 60), width=2)
r = 24
d.ellipse([W // 2 - r, y - r, W // 2 + r, y + r], outline=(255, 255, 255), width=4)
d.ellipse([W // 2 - 5, y - 5, W // 2 + 5, y + 5], fill=(255, 255, 255))
d.ellipse([W // 2 + 12, y - 30, W // 2 + 28, y - 14], fill=(255, 255, 255))

# apps
centered('CLOCK RINGS   ·   MERIT   ·   ORBIT', y + 70, 40, (150, 150, 150), track=6, idx=1)

out = bg.convert('RGB')
out.save('src/background@3x.png')
out.resize((750, 1100), Image.LANCZOS).save('src/background@2x.png')
out.resize((375, 550), Image.LANCZOS).save('src/background.png')
out.save('/tmp/poster-preview.png')

p = json.load(open('src/pass.json'))
card = p.pop('storeCard', None) or p.pop('eventTicket')
p['eventTicket'] = card
p['preferredStyleSchemes'] = ['posterEventTicket', 'eventTicket']
p['semantics'] = {'eventName': 'Eric Rogers Technology', 'eventType': 'PKEventTypeGeneric'}
p['backgroundColor'] = 'rgb(10, 10, 10)'
json.dump(p, open('src/pass.json', 'w'), indent=2, ensure_ascii=False)
open('src/pass.json', 'a').write('\n')
