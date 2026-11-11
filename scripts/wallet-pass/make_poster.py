"""The Wallet poster artwork is designed by hand: poster-source.png (1080 x 1560, with extra room at the
bottom because Wallet covers the bottom ~25% of the card with a gray fade). This script resizes it into
src/background*.png and the header logo into src/logo*.png. Run from this folder."""
from PIL import Image

img = Image.open('poster-source.png').convert('RGB')
w3 = 1170
h3 = round(img.height * w3 / img.width)
big = img.resize((w3, h3), Image.LANCZOS)
big.save('src/background@3x.png')
big.resize((780, round(h3 * 780 / 1170)), Image.LANCZOS).save('src/background@2x.png')
big.resize((390, round(h3 * 390 / 1170)), Image.LANCZOS).save('src/background.png')

lg = Image.open('../../ert-logo-light.png').convert('RGBA')
for name, h in [('logo.png', 50), ('logo@2x.png', 100), ('logo@3x.png', 150)]:
    lg.resize((int(lg.width * h / lg.height), h), Image.LANCZOS).save('src/' + name)
