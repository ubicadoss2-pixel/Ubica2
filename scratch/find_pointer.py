import sys
from PIL import Image

img = Image.open("c:/Users/Laura/OneDrive/Documentos/ubica2-main/Ubica2/fronted/public/assets/logo.png").convert("RGBA")
width, height = img.size

pixels = img.load()
for y in range(height-1, -1, -1):
    has_purple = False
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a > 100 and r > 50 and b > 150: # Purple-ish
            has_purple = True
            break
    if has_purple:
        print(f"Purple pointer ends at Y={y}")
        break
