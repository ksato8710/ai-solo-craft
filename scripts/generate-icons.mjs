import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// SVGアイコンを作成（グラデーション背景 + "AI" テキスト）
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#10B981;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
        font-family="Inter, system-ui, sans-serif" font-weight="800" 
        font-size="${size * 0.4}" fill="white">AI</text>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = '/Users/satokeita/Dev/ai-navigator/public/icons';

// SVGファイルを作成
for (const size of sizes) {
  const svg = createSvg(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg.trim());
  console.log(`Created: ${svgPath}`);
}

// apple-touch-icon用（180x180）
const appleSize = 180;
const appleSvg = createSvg(appleSize);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleSvg.trim());
console.log('Created: apple-touch-icon.svg');

// favicon用（32x32）
const faviconSize = 32;
const faviconSvg = createSvg(faviconSize);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg.trim());
console.log('Created: favicon.svg');

console.log('\\nNote: SVGs created. For PNG conversion, use a tool like sharp or Inkscape.');
console.log('For now, SVGs will work for most modern browsers.');
