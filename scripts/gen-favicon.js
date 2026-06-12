const sharp = require('sharp');
const fs = require('fs');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#0a0a0a"/>
  <text x="4" y="23" font-family="monospace" font-size="18" font-weight="bold" fill="#33ff00">&gt;_</text>
</svg>`;

async function gen() {
  const png32 = await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer();
  const png180 = await sharp(Buffer.from(svg)).resize(180, 180).png().toBuffer();

  fs.writeFileSync('public/favicon.png', png32);
  fs.writeFileSync('public/apple-touch-icon.png', png180);

  console.log('Generated favicon.png (32x32) and apple-touch-icon.png (180x180)');
}
gen();
