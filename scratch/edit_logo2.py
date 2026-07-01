import sys
from PIL import Image

def find_split_row(img):
    width, height = img.size
    # We look for a gap of transparent rows in the middle third of the image
    start_y = int(height * 0.3)
    end_y = int(height * 0.8)
    
    pixels = img.load()
    
    # Identify non-transparent rows
    row_has_pixels = []
    for y in range(height):
        has_pixel = False
        for x in range(width):
            if pixels[x, y][3] > 10:  # alpha > 10
                has_pixel = True
                break
        row_has_pixels.append(has_pixel)
        
    # Find the largest gap in the middle
    longest_gap = 0
    current_gap = 0
    best_split_y = int(height * 0.6) # default
    gap_start = 0
    
    for y in range(start_y, end_y):
        if not row_has_pixels[y]:
            if current_gap == 0:
                gap_start = y
            current_gap += 1
        else:
            if current_gap > longest_gap:
                longest_gap = current_gap
                best_split_y = gap_start + current_gap // 2
            current_gap = 0
            
    if current_gap > longest_gap:
        best_split_y = gap_start + current_gap // 2
        
    return best_split_y

def process_logo(input_path, output_path, bg_color=None):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    split_y = find_split_row(img)
    print(f"Split {input_path} at Y={split_y}")
    
    pointer_box = (0, 0, width, split_y)
    text_box = (0, split_y, width, height)
    
    pointer_img = img.crop(pointer_box)
    text_img = img.crop(text_box)
    
    pointer_bbox = pointer_img.getbbox()
    text_bbox = text_img.getbbox()
    
    if pointer_bbox:
        pointer_img = pointer_img.crop(pointer_bbox)
    if text_bbox:
        text_img = text_img.crop(text_bbox)
        
    padding = 20
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
    
    # For logos with solid backgrounds, we need to treat the solid color as transparent for the split calculation
    # Or just use the split_y from the transparent logo for all of them!
    
    img_trans = Image.open(base_dir + "logo.png").convert("RGBA")
    split_y = find_split_row(img_trans)
    
    def process_with_split(input_path, output_path, split_y, bg_color=None):
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        pointer_box = (0, 0, width, split_y)
        text_box = (0, split_y, width, height)
        
        pointer_img = img.crop(pointer_box)
        text_img = img.crop(text_box)
        
        # We need a custom getbbox that ignores the background color
        def get_custom_bbox(im, bg):
            if bg is None:
                return im.getbbox()
            
            w, h = im.size
            pixels = im.load()
            min_x = w; min_y = h; max_x = 0; max_y = 0
            has_pixels = False
            for y in range(h):
                for x in range(w):
                    p = pixels[x, y]
                    # Check distance from bg color
                    dist = sum(abs(p[i] - bg[i]) for i in range(3))
                    if dist > 30: # arbitrary threshold
                        if x < min_x: min_x = x
                        if x > max_x: max_x = x
                        if y < min_y: min_y = y
                        if y > max_y: max_y = y
                        has_pixels = True
            if has_pixels:
                return (min_x, min_y, max_x + 1, max_y + 1)
            return None
            
        p_bbox = get_custom_bbox(pointer_img, bg_color)
        t_bbox = get_custom_bbox(text_img, bg_color)
        
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
        new_img.paste(pointer_img, (padding, pointer_y), pointer_img if bg_color is None else None)
        
        text_y = (new_height - text_img.height) // 2
        new_img.paste(text_img, (padding * 2 + pointer_img.width, text_y), text_img if bg_color is None else None)
        
        new_img.save(output_path)
        print(f"Saved {output_path}")

    process_with_split(base_dir + "logo.png", base_dir + "logo.png", split_y, None)
    process_with_split(base_dir + "logo_final.png", base_dir + "logo_final.png", split_y, (0,0,0,255))
    process_with_split(base_dir + "logo_hero.png", base_dir + "logo_hero.png", split_y, (10, 15, 40, 255))
