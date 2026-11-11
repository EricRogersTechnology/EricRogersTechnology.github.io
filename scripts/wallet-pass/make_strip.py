"""Draws the Wallet pass images: the header logo and the banner (strip) with the contact lines.
Run from this folder."""
from PIL import Image, ImageDraw, ImageFont

FONT = '/System/Library/Fonts/HelveticaNeue.ttc'
EDGE = 15
lg = Image.open('../../ert-logo-light.png').convert('RGBA')

# header logo: Wallet shows this in the pass stack (max 160 x 50 points)
for name, h in [('logo.png', 50), ('logo@2x.png', 100), ('logo@3x.png', 150)]:
    w = int(lg.width * h / lg.height)
    lg.resize((w, h), Image.LANCZOS).save('src/' + name)

# banner: orbit divider, contact lines, apps
W, H = 1125, 432
bg = Image.new('RGBA', (W, H), (EDGE,) * 3 + (255,))
d = ImageDraw.Draw(bg)

def centered(text, y, font, fill, track=0):
    w = sum(d.textlength(c, font=font) + track for c in text) - track
    x = (W - w) / 2
    for c in text:
        d.text((x, y), c, font=font, fill=fill)
        x += d.textlength(c, font=font) + track

y = 26
r = 14
d.line([(200, y + r), (W // 2 - 40, y + r)], fill=(255, 255, 255, 70), width=2)
d.line([(W // 2 + 40, y + r), (W - 200, y + r)], fill=(255, 255, 255, 70), width=2)
d.ellipse([W // 2 - r, y, W // 2 + r, y + 2 * r], outline=(235, 235, 235), width=3)
d.ellipse([W // 2 - 3, y + r - 3, W // 2 + 3, y + r + 3], fill=(235, 235, 235))
d.ellipse([W // 2 + 8, y - 7, W // 2 + 19, y + 4], fill=(255, 255, 255))
y += 2 * r + 26

font = ImageFont.truetype(FONT, 56, index=0)
for line in ['EricRogersTechnology.com', 'Eric@EricRogersTechnology.com', '260.207.4335']:
    centered(line, y, font, (232, 232, 232))
    y += 68
centered('CLOCK RINGS   ·   MERIT   ·   ORBIT', y + 4, ImageFont.truetype(FONT, 30, index=1), (140, 140, 140), track=5)

out = bg.convert('RGB')
out.save('src/strip@3x.png')
out.resize((750, 288), Image.LANCZOS).save('src/strip@2x.png')
out.resize((375, 144), Image.LANCZOS).save('src/strip.png')
out.save('/tmp/strip-v11.png')
