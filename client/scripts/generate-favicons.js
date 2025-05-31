const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512
};

const sourceSvg = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(sourceSvg);

    // Generate PNG files
    for (const [filename, size] of Object.entries(sizes)) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, filename));
      console.log(`Generated ${filename}`);
    }

    // Generate ICO file (16x16, 32x32, 48x48)
    const icoSizes = [16, 32, 48];
    const icoBuffers = await Promise.all(
      icoSizes.map(size =>
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );

    // Save as ICO
    await sharp(icoBuffers[0])
      .joinChannel(icoBuffers[1])
      .joinChannel(icoBuffers[2])
      .toFile(path.join(outputDir, 'favicon.ico'));
    console.log('Generated favicon.ico');

    // Generate Safari pinned tab SVG
    fs.copyFileSync(sourceSvg, path.join(outputDir, 'safari-pinned-tab.svg'));
    console.log('Generated safari-pinned-tab.svg');

  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 