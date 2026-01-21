# Generate PWA Icons

Gunakan salah satu cara berikut untuk generate icon PNG dari icon.svg:

## Cara 1: Online Tool (Paling Mudah)
1. Buka https://realfavicongenerator.net/
2. Upload file icon.svg
3. Download semua icon yang dihasilkan
4. Copy ke folder /public/icons/

## Cara 2: Menggunakan ImageMagick (Terminal)
```bash
cd public/icons
for size in 16 32 72 96 128 144 152 192 384 512; do
  convert icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done
```

## Cara 3: Menggunakan Sharp (Node.js)
```bash
npm install sharp
node -e "
const sharp = require('sharp');
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  sharp('icon.svg')
    .resize(size, size)
    .png()
    .toFile(\`icon-\${size}x\${size}.png\`);
});
"
```

## Icon yang dibutuhkan:
- icon-16x16.png
- icon-32x32.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
