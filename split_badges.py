from PIL import Image, ImageChops

def split_and_clean():
    img = Image.open('public/frames_spritesheet.png').convert('RGBA')
    w, h = img.size
    cols, rows = 3, 3
    cw, ch = w // cols, h // rows
    
    names = [
        ['gold_1', 'silver_1', 'bronze_1'],
        ['gold_2', 'silver_2', 'bronze_2'],
        ['gold_3', 'silver_3', 'bronze_3']
    ]

    import os
    if not os.path.exists('public/badges'):
        os.makedirs('public/badges')

    for r in range(rows):
        for c in range(cols):
            left = c * cw
            top = r * ch
            right = left + cw
            bottom = top + ch
            
            crop = img.crop((left, top, right, bottom))
            
            # Simple "Remove Black Background" Logic
            # We treat the pixel intensity as a mask for alpha
            datas = crop.getdata()
            newData = []
            for item in datas:
                # If it's very dark, make it transparent
                # Using a slightly soft threshold
                avg = (item[0] + item[1] + item[2]) / 3
                if avg < 40: # threshold for dark background
                    alpha = int(max(0, (avg - 10) * 255 / 30)) if avg > 10 else 0
                    newData.append((item[0], item[1], item[2], alpha))
                else:
                    newData.append(item)
            
            crop.putdata(newData)
            
            name = names[r][c]
            crop.save(f'public/badges/{name}.png')
            print(f'Saved public/badges/{name}.png')

if __name__ == "__main__":
    split_and_clean()
