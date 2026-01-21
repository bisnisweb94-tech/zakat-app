import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconPath = join(__dirname, 'public', 'icons', 'icon.svg');
const outputDir = join(__dirname, 'public', 'icons');

console.log('🎨 Generating PWA icons from icon.svg...\n');

async function generateIcons() {
    const svgBuffer = readFileSync(iconPath);

    for (const size of sizes) {
        const outputPath = join(outputDir, `icon-${size}x${size}.png`);

        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(outputPath);

        console.log(`✅ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n🎉 All icons generated successfully!');
    console.log('📱 Your PWA is now ready to be installed on mobile devices.');
}

generateIcons().catch(err => {
    console.error('❌ Error generating icons:', err);
    process.exit(1);
});
