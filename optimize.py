import os
from PIL import Image

# Define your folders
input_folder = "raw_pages"
output_folder = "ready_pages"

# Create output folder if it doesn't exist
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

print("⏳ Starting manga page optimization...")

count = 0
for filename in os.listdir(input_folder):
    if filename.lower().endswith((".png", ".jpg", ".jpeg")):
        # Open the heavy image
        img_path = os.path.join(input_folder, filename)
        img = Image.open(img_path).convert("RGB") # Convert to RGB to avoid alpha channel issues
        
        # Change the extension to .webp
        new_filename = os.path.splitext(filename)[0] + ".webp"
        output_path = os.path.join(output_folder, new_filename)
        
        # Compress and save as WebP! (80 quality is the sweet spot)
        img.save(output_path, "webp", quality=80)
        
        count += 1
        print(f"✅ Shrunk: {filename} -> {new_filename}")

print(f"🎉 Success! {count} pages optimized and ready to upload.")