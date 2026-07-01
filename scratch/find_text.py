import sys
from PIL import Image

img = Image.open("c:/Users/Laura/OneDrive/Documentos/ubica2-main/Ubica2/fronted/public/assets/logo.png").convert("RGBA")
width, height = img.size

pixels = img.load()
for y in range(height):
    has_white = False
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a > 100 and r > 200 and g > 200 and b > 200:
            has_white = True
            break
    if has_white:
        print(f"White text starts at Y={y}")
        break
