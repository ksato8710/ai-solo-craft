#!/usr/bin/env node

/**
 * サムネイルデザイン v2 — Claude/Anthropic ブランド活用版
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'public', 'thumbnails');
const WIDTH = 1200;
const HEIGHT = 630;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Claude Brand Colors ─────────────────────────────────
const CLAUDE = {
  terracotta: '#da7756',
  terracottaDark: '#C15F3C',
  terracottaLight: '#e8956f',
  pampas: '#F4F3EE',
  cloudy: '#B1ADA1',
  black: '#1a1a1a',
  cream: '#FFF8F0',
  warmWhite: '#FAF5EF',
};

// ─── Claude Starburst Icon (SVG) ──────────────────────────
// Abstract pinwheel / starburst radiating outward
function claudeStarburst(cx, cy, size, color, opacity = 1) {
  const r = size;
  const innerR = size * 0.25;
  const points = 8;
  let pathD = '';

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const nextAngle = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;

    const outerX = cx + Math.cos(angle) * r;
    const outerY = cy + Math.sin(angle) * r;
    const innerX = cx + Math.cos(nextAngle) * innerR;
    const innerY = cy + Math.sin(nextAngle) * innerR;

    if (i === 0) {
      pathD += `M ${outerX} ${outerY} `;
    } else {
      pathD += `L ${outerX} ${outerY} `;
    }
    pathD += `Q ${cx + Math.cos((angle + nextAngle) / 2) * r * 0.5} ${cy + Math.sin((angle + nextAngle) / 2) * r * 0.5} ${innerX} ${innerY} `;
  }
  pathD += 'Z';

  return `<path d="${pathD}" fill="${color}" opacity="${opacity}"/>`;
}

// Smoother starburst with rounded petals
function claudeSparkle(cx, cy, size, color, opacity = 1) {
  const petals = 4;
  const petalLength = size;
  const petalWidth = size * 0.3;
  let paths = '';

  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * 180;
    paths += `
      <ellipse cx="${cx}" cy="${cy - petalLength / 2}" rx="${petalWidth}" ry="${petalLength / 2}"
        fill="${color}" opacity="${opacity}" transform="rotate(${angle}, ${cx}, ${cy})"/>
    `;
  }

  // Center circle
  paths += `<circle cx="${cx}" cy="${cy}" r="${size * 0.18}" fill="${color}" opacity="${opacity}"/>`;

  return paths;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pattern 1: "Claude Warm" — テラコッタ背景 + スターバーストマスコット
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function pattern1() {
  // Claude starburst as main mascot character (large, right side)
  const mascot = `
    <g transform="translate(880, 280)">
      <!-- Large starburst body -->
      ${claudeSparkle(0, 0, 160, CLAUDE.pampas, 0.95)}

      <!-- Face plate -->
      <circle cx="0" cy="0" r="55" fill="${CLAUDE.terracottaDark}"/>

      <!-- Eyes -->
      <ellipse cx="-18" cy="-8" rx="10" ry="13" fill="${CLAUDE.pampas}"/>
      <ellipse cx="18" cy="-8" rx="10" ry="13" fill="${CLAUDE.pampas}"/>
      <circle cx="-16" cy="-6" r="6" fill="${CLAUDE.black}"/>
      <circle cx="20" cy="-6" r="6" fill="${CLAUDE.black}"/>
      <!-- Eye sparkle -->
      <circle cx="-14" cy="-9" r="2.5" fill="white"/>
      <circle cx="22" cy="-9" r="2.5" fill="white"/>

      <!-- Gentle smile -->
      <path d="M -15 12 Q 0 28 15 12" stroke="${CLAUDE.pampas}" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
  `;

  // Floating mini sparkles
  const sparkles = `
    ${claudeSparkle(750, 100, 25, CLAUDE.pampas, 0.3)}
    ${claudeSparkle(1100, 450, 20, CLAUDE.pampas, 0.25)}
    ${claudeSparkle(680, 500, 18, '#ffffff', 0.15)}
    ${claudeSparkle(1050, 150, 15, '#ffffff', 0.2)}
  `;

  // Speech bubble from mascot
  const bubble = `
    <g transform="translate(720, 70)">
      <rect x="0" y="0" width="200" height="80" rx="20" fill="white" opacity="0.95"/>
      <polygon points="120,80 100,110 140,80" fill="white" opacity="0.95"/>
      <text x="100" y="35" font-family="serif" font-size="18" font-weight="700" fill="${CLAUDE.terracottaDark}" text-anchor="middle">Sonnet 4.6</text>
      <text x="100" y="60" font-family="sans-serif" font-size="13" fill="${CLAUDE.cloudy}" text-anchor="middle">Production Ready</text>
    </g>
  `;

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${CLAUDE.terracotta}"/>
        <stop offset="60%" stop-color="${CLAUDE.terracottaDark}"/>
        <stop offset="100%" stop-color="#a84e30"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg1)"/>

    <!-- Subtle texture dots -->
    <g opacity="0.06">
      ${Array.from({ length: 20 }, (_, i) =>
        Array.from({ length: 10 }, (_, j) =>
          `<circle cx="${30 + i * 60}" cy="${30 + j * 65}" r="2" fill="white"/>`
        ).join('')
      ).join('')}
    </g>

    ${sparkles}
    ${mascot}
    ${bubble}

    <!-- Category badge -->
    <rect x="60" y="100" width="120" height="42" rx="21" fill="white" opacity="0.95"/>
    <text x="120" y="127" font-family="sans-serif" font-size="17" font-weight="800" fill="${CLAUDE.terracottaDark}" text-anchor="middle">NEWS</text>

    <!-- Title -->
    <text font-family="serif" font-weight="900" fill="white">
      <tspan x="60" y="230" font-size="58">Claude</tspan>
      <tspan x="60" y="300" font-size="58">Sonnet 4.6:</tspan>
    </text>
    <text font-family="sans-serif" font-weight="700" fill="${CLAUDE.pampas}">
      <tspan x="60" y="375" font-size="40">実運用の標準モデル</tspan>
      <tspan x="60" y="425" font-size="40">としての現実解</tspan>
    </text>

    <!-- Brand bar -->
    <rect x="60" y="465" width="60" height="4" rx="2" fill="white" opacity="0.6"/>
    <text x="60" y="502" font-family="sans-serif" font-size="16" font-weight="600" fill="white" opacity="0.7" letter-spacing="2">AI SOLO BUILDER</text>
  </svg>`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pattern 2: "Claude Elegant" — クリーム背景 + 大きなスターバースト
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function pattern2() {
  // Large decorative starburst background element
  const bgStarburst = `
    ${claudeSparkle(950, 320, 280, CLAUDE.terracotta, 0.08)}
    ${claudeSparkle(950, 320, 200, CLAUDE.terracotta, 0.06)}
  `;

  // Claude character — starburst with face + arms
  const mascot = `
    <g transform="translate(920, 260)">
      <!-- Body glow -->
      <circle cx="0" cy="0" r="120" fill="${CLAUDE.terracotta}" opacity="0.08"/>

      <!-- Starburst body -->
      ${claudeSparkle(0, 0, 110, CLAUDE.terracotta, 1)}

      <!-- Face circle -->
      <circle cx="0" cy="0" r="48" fill="${CLAUDE.cream}"/>

      <!-- Eyes -->
      <circle cx="-14" cy="-6" r="7" fill="${CLAUDE.terracottaDark}"/>
      <circle cx="14" cy="-6" r="7" fill="${CLAUDE.terracottaDark}"/>
      <circle cx="-12" cy="-8" r="2.5" fill="white"/>
      <circle cx="16" cy="-8" r="2.5" fill="white"/>

      <!-- Smile -->
      <path d="M -12 10 Q 0 22 12 10" stroke="${CLAUDE.terracottaDark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>

      <!-- Little hands (circles at petal tips) -->
      <circle cx="-110" cy="0" r="14" fill="${CLAUDE.terracottaLight}" stroke="${CLAUDE.terracottaDark}" stroke-width="2"/>
      <circle cx="110" cy="0" r="14" fill="${CLAUDE.terracottaLight}" stroke="${CLAUDE.terracottaDark}" stroke-width="2"/>

      <!-- Holding a sign -->
      <g transform="translate(55, -130)">
        <rect x="0" y="0" width="120" height="55" rx="12" fill="${CLAUDE.terracottaDark}"/>
        <text x="60" y="25" font-family="sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">Sonnet 4.6</text>
        <text x="60" y="43" font-family="sans-serif" font-size="11" fill="${CLAUDE.terracottaLight}" text-anchor="middle">Anthropic</text>
      </g>
    </g>
  `;

  // Mini sparkles
  const sparkles = `
    ${claudeSparkle(100, 80, 20, CLAUDE.terracotta, 0.2)}
    ${claudeSparkle(700, 60, 15, CLAUDE.terracotta, 0.15)}
    ${claudeSparkle(780, 550, 18, CLAUDE.terracotta, 0.12)}
    ${claudeSparkle(150, 550, 12, CLAUDE.cloudy, 0.2)}
  `;

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${CLAUDE.pampas}"/>

    <!-- Subtle warm gradient overlay -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${CLAUDE.terracotta}" opacity="0.03"/>

    ${bgStarburst}
    ${sparkles}
    ${mascot}

    <!-- Category badge -->
    <rect x="60" y="80" width="120" height="42" rx="21" fill="${CLAUDE.terracottaDark}"/>
    <text x="120" y="107" font-family="sans-serif" font-size="17" font-weight="800" fill="white" text-anchor="middle">NEWS</text>

    <!-- Title -->
    <text font-family="serif" font-weight="900" fill="${CLAUDE.black}">
      <tspan x="60" y="210" font-size="58">Claude</tspan>
      <tspan x="60" y="280" font-size="58">Sonnet 4.6:</tspan>
    </text>
    <text font-family="sans-serif" font-weight="700" fill="${CLAUDE.terracottaDark}">
      <tspan x="60" y="355" font-size="42">実運用の標準モデル</tspan>
      <tspan x="60" y="407" font-size="42">としての現実解</tspan>
    </text>

    <!-- Divider -->
    <rect x="60" y="440" width="80" height="4" rx="2" fill="${CLAUDE.terracotta}"/>

    <!-- Brand -->
    <g transform="translate(60, 470)">
      <rect width="210" height="38" rx="19" fill="${CLAUDE.terracotta}" opacity="0.1"/>
      <text x="105" y="25" font-family="sans-serif" font-size="15" font-weight="700" fill="${CLAUDE.terracottaDark}" text-anchor="middle" letter-spacing="1">AI SOLO BUILDER</text>
    </g>
  </svg>`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pattern 3: "Claude Dark" — ダーク背景 + テラコッタアクセント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function pattern3() {
  const darkBg = '#1a1520';
  const darkBg2 = '#231e2a';

  // Starburst mascot with warm glow
  const mascot = `
    <g transform="translate(900, 280)">
      <!-- Warm glow behind -->
      <circle cx="0" cy="0" r="180" fill="${CLAUDE.terracotta}" opacity="0.06"/>
      <circle cx="0" cy="0" r="140" fill="${CLAUDE.terracotta}" opacity="0.08"/>

      <!-- Large starburst -->
      ${claudeSparkle(0, 0, 130, CLAUDE.terracotta, 0.9)}

      <!-- Inner glow ring -->
      <circle cx="0" cy="0" r="58" fill="${darkBg}" stroke="${CLAUDE.terracottaLight}" stroke-width="2" opacity="0.8"/>

      <!-- Face -->
      <circle cx="0" cy="0" r="52" fill="${darkBg2}"/>

      <!-- Eyes - glowing -->
      <circle cx="-16" cy="-6" r="8" fill="${CLAUDE.terracotta}"/>
      <circle cx="16" cy="-6" r="8" fill="${CLAUDE.terracotta}"/>
      <circle cx="-14" cy="-8" r="3" fill="${CLAUDE.terracottaLight}"/>
      <circle cx="18" cy="-8" r="3" fill="${CLAUDE.terracottaLight}"/>

      <!-- Smile -->
      <path d="M -14 14 Q 0 26 14 14" stroke="${CLAUDE.terracotta}" stroke-width="2.5" fill="none" stroke-linecap="round"/>

      <!-- Orbiting mini sparkles -->
      ${claudeSparkle(-140, -80, 18, CLAUDE.terracottaLight, 0.5)}
      ${claudeSparkle(150, -60, 14, CLAUDE.terracottaLight, 0.4)}
      ${claudeSparkle(130, 120, 16, CLAUDE.terracottaLight, 0.35)}
      ${claudeSparkle(-120, 100, 12, CLAUDE.terracottaLight, 0.3)}

      <!-- Orbit lines -->
      <circle cx="0" cy="0" r="160" fill="none" stroke="${CLAUDE.terracotta}" stroke-width="0.8" opacity="0.15" stroke-dasharray="6 8"/>
    </g>
  `;

  // Decorative elements
  const decor = `
    <!-- Floating sparkles left side -->
    ${claudeSparkle(100, 100, 22, CLAUDE.terracotta, 0.15)}
    ${claudeSparkle(650, 80, 16, CLAUDE.terracottaLight, 0.1)}
    ${claudeSparkle(180, 520, 14, CLAUDE.terracotta, 0.12)}

    <!-- Subtle grid -->
    <g opacity="0.03">
      ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="${HEIGHT}" stroke="${CLAUDE.terracotta}" stroke-width="1"/>`).join('')}
      ${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="${WIDTH}" y2="${i * 60}" stroke="${CLAUDE.terracotta}" stroke-width="1"/>`).join('')}
    </g>
  `;

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${darkBg}"/>
        <stop offset="100%" stop-color="${darkBg2}"/>
      </linearGradient>
      <linearGradient id="textGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${CLAUDE.terracottaLight}"/>
        <stop offset="100%" stop-color="${CLAUDE.terracotta}"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg3)"/>

    ${decor}
    ${mascot}

    <!-- Accent line -->
    <rect x="60" y="130" width="200" height="3" rx="1.5" fill="${CLAUDE.terracotta}" opacity="0.4"/>

    <!-- "Anthropic" label -->
    <text x="60" y="120" font-family="serif" font-size="18" font-weight="600" fill="${CLAUDE.terracotta}" opacity="0.7" letter-spacing="3">ANTHROPIC</text>

    <!-- Category badge -->
    <rect x="60" y="155" width="130" height="38" rx="19" fill="${CLAUDE.terracotta}22" stroke="${CLAUDE.terracotta}" stroke-width="1.5"/>
    <text x="125" y="180" font-family="sans-serif" font-size="16" font-weight="700" fill="${CLAUDE.terracotta}" text-anchor="middle">NEWS</text>

    <!-- Title -->
    <text font-family="serif" font-weight="900" fill="${CLAUDE.pampas}">
      <tspan x="60" y="260" font-size="54">Claude Sonnet 4.6:</tspan>
    </text>
    <text font-family="sans-serif" font-weight="700" fill="${CLAUDE.terracottaLight}">
      <tspan x="60" y="330" font-size="44">実運用の標準モデル</tspan>
      <tspan x="60" y="385" font-size="44">としての現実解</tspan>
    </text>

    <!-- Divider -->
    <rect x="60" y="420" width="60" height="3" rx="1.5" fill="${CLAUDE.terracotta}" opacity="0.5"/>

    <!-- Brand -->
    <text x="60" y="460" font-family="sans-serif" font-size="16" font-weight="600" fill="${CLAUDE.cloudy}" opacity="0.6" letter-spacing="2">AI SOLO BUILDER</text>
  </svg>`;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Generate
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  const slug = 'jp-brief-sonnet-46-2026-02-22';

  const patterns = [
    { name: '1', label: 'Claude Warm (テラコッタ背景)', fn: pattern1 },
    { name: '2', label: 'Claude Elegant (クリーム背景)', fn: pattern2 },
    { name: '3', label: 'Claude Dark (ダーク+テラコッタ)', fn: pattern3 },
  ];

  for (const { name, label, fn } of patterns) {
    const svg = fn();
    const outputPath = path.join(OUTPUT_DIR, `${slug}-v2-${name}.png`);
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    fs.writeFileSync(outputPath, buf);
    const sizeKb = (buf.length / 1024).toFixed(0);
    console.log(`✅ Pattern ${name} (${label}): ${sizeKb} KB`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
