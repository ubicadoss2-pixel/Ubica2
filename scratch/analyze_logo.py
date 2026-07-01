import sys
from PIL import Image

img = Image.open("c:/Users/Laura/OneDrive/Documentos/ubica2-main/Ubica2/fronted/public/assets/logo.png").convert("RGBA")
width, height = img.size

pixels = img.load()
for y in range(400, 700):
    has_pixel = False
    for x in range(width):
        if pixels[x, y][3] > 20:
            has_pixel = True
            break
    if not has_pixel:
        print(f"Empty row: {y}")
