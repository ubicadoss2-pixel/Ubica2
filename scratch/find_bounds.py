import sys
from PIL import Image

img = Image.open("c:/Users/Laura/OneDrive/Documentos/ubica2-main/Ubica2/fronted/public/assets/logo.png").convert("RGBA")
width, height = img.size
pixels = img.load()

# Find text bounding box
text_min_x, text_max_x = width, 0
text_min_y, text_max_y = height, 0
for y in range(599, height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a > 50 and r > 150 and g > 150 and b > 150:
            if x < text_min_x: text_min_x = x
            if x > text_max_x: text_max_x = x
            if y < text_min_y: text_min_y = y
            if y > text_max_y: text_max_y = y

# Find pointer bounding box
ptr_min_x, ptr_max_x = width, 0
ptr_min_y, ptr_max_y = height, 0
for y in range(0, height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a > 50 and (r < 150 or g < 150 or b < 150): # Not white text
            if x < ptr_min_x: ptr_min_x = x
            if x > ptr_max_x: ptr_max_x = x
            if y < ptr_min_y: ptr_min_y = y
            if y > ptr_max_y: ptr_max_y = y

print(f"Text bounds: X({text_min_x}-{text_max_x}), Y({text_min_y}-{text_max_y})")
print(f"Pointer bounds: X({ptr_min_x}-{ptr_max_x}), Y({ptr_min_y}-{ptr_max_y})")
