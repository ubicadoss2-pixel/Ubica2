import sys
from PIL import Image

def process_logo(input_path, output_path, bg_color=None):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    pointer_img = Image.new("RGBA", (width, height), (0,0,0,0))
    text_img = Image.new("RGBA", (width, height), (0,0,0,0))
    
    pixels = img.load()
    p_pixels = pointer_img.load()
    t_pixels = text_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            
            if bg_color is not None:
                br, bg, bb, ba = bg_color
                if abs(r - br) < 20 and abs(g - bg) < 20 and abs(b - bb) < 20:
                    continue # Ignore background
            
            # Is it white text?
            if r > 180 and g > 180 and b > 180 and abs(r - g) < 20 and abs(r - b) < 20:
                t_pixels[x, y] = (r, g, b, a)
            else:
                # Must be pointer (or shadow of pointer)
                p_pixels[x, y] = (r, g, b, a)
                
    p_bbox = pointer_img.getbbox()
    t_bbox = text_img.getbbox()
    
    if p_bbox: pointer_img = pointer_img.crop(p_bbox)
    if t_bbox: text_img = text_img.crop(t_bbox)
    
    padding = 40
    new_width = pointer_img.width + text_img.width + padding * 3
    new_height = max(pointer_img.height, text_img.height) + padding * 2
    
    if bg_color:
        new_img = Image.new("RGBA", (new_width, new_height), bg_color)
    else:
        new_img = Image.new("RGBA", (new_width, new_height), (255, 255, 255, 0))
        
    pointer_y = (new_height - pointer_img.height) // 2
    new_img.paste(pointer_img, (padding, pointer_y), pointer_img)
    
    text_y = (new_height - text_img.height) // 2
    new_img.paste(text_img, (padding * 2 + pointer_img.width, text_y), text_img)
    
    new_img.save(output_path)
    print(f"Saved {output_path}")

if __name__ == "__main__":
    base_dir = "c:/Users/Laura/OneDrive/Documentos/ubica2-main/Ubica2/fronted/public/assets/"
    
    process_logo(base_dir + "logo.png", base_dir + "logo.png", None)
    process_logo(base_dir + "logo_final.png", base_dir + "logo_final.png", (0,0,0,255))
    process_logo(base_dir + "logo_hero.png", base_dir + "logo_hero.png", (10, 15, 40, 255))
