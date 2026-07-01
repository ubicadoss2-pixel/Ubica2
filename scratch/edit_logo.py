import sys
from PIL import Image

def process_logo(input_path, output_path, bg_color=None):
    # Load the image
    img = Image.open(input_path).convert("RGBA")
    
    # We want to split the image into top (pointer) and bottom (text).
    # Since it's a square image, let's look at the pixels.
    width, height = img.size
    
    # Heuristics for the provided images based on their look:
    # Pointer is in the top half, text is in the bottom half.
    # Let's crop it into two pieces.
    pointer_box = (0, 0, width, int(height * 0.6))
    text_box = (0, int(height * 0.6), width, height)
    
    pointer_img = img.crop(pointer_box)
    text_img = img.crop(text_box)
    
    # Now we need to remove empty space around them
    pointer_bbox = pointer_img.getbbox()
    text_bbox = text_img.getbbox()
    
    if pointer_bbox:
        pointer_img = pointer_img.crop(pointer_bbox)
    if text_bbox:
        text_img = text_img.crop(text_bbox)
        
    # Create a new image side by side
    # New width is sum of widths + some padding.
    # New height is max of heights.
    padding = 20
    new_width = pointer_img.width + text_img.width + padding * 3
    new_height = max(pointer_img.height, text_img.height) + padding * 2
    
    # Make a background
    if bg_color:
        new_img = Image.new("RGBA", (new_width, new_height), bg_color)
    else:
        new_img = Image.new("RGBA", (new_width, new_height), (255, 255, 255, 0))
        
    # Paste pointer on the left
    pointer_y = (new_height - pointer_img.height) // 2
    new_img.paste(pointer_img, (padding, pointer_y), pointer_img)
    
    # Paste text on the right
    text_y = (new_height - text_img.height) // 2
    new_img.paste(text_img, (padding * 2 + pointer_img.width, text_y), text_img)
    
    # Save the result
    new_img.save(output_path)
    print(f"Saved {output_path}")

if __name__ == "__main__":
    base_dir = "c:/Users/Laura/OneDrive/Documentos/ubica2-main/Ubica2/fronted/public/assets/"
    
    # Process logo.png (transparent background)
    process_logo(base_dir + "logo.png", base_dir + "logo.png")
    
    # Process logo_final.png (black background)
    process_logo(base_dir + "logo_final.png", base_dir + "logo_final.png", bg_color=(0,0,0,255))
    
    # Process logo_hero.png (dark background)
    # The dark background in logo_hero is somewhat complex (maybe a gradient).
    # But it's okay to make it a transparent one for now or just a solid dark color.
    process_logo(base_dir + "logo_hero.png", base_dir + "logo_hero.png", bg_color=(10, 15, 40, 255))
