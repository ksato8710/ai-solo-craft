#!/usr/bin/env node

/**
 * サムネイル画像自動生成スクリプト
 *
 * DALL-E 3 で記事カテゴリに応じた抽象背景を生成し、
 * Sharp でタイトル・カテゴリバッジを合成して保存する。
 *
 * Usage:
 *   node scripts/generate-thumbnail.mjs --slug "morning-news-2026-02-21"
 *   node scripts/generate-thumbnail.mjs --missing
 *   node scripts/generate-thumbnail.mjs --all
 *   node scripts/generate-thumbnail.mjs --slug "..." --no-ai
 *   node scripts/generate-thumbnail.mjs --missing --dry-run
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

// ─── Constants ────────────────────────────────────────────

const ROOT = process.cwd();
const NEWS_DIR = path.join(ROOT, 'content', 'news');
const OUTPUT_DIR = path.join(ROOT, 'public', 'thumbnails');
const ENV_FILES = ['.env.local', '.env'];

const WIDTH = 1200;
const HEIGHT = 630;

// Category → visual theme mapping
const CATEGORY_THEMES = {
  'morning-summary': {
    color: '#3B82F6',
    label: '朝刊Digest',
    emoji: '🗞️',
    dalleHint: 'dawn gradient, blue electric glow, data visualization nodes, soft morning light',
    gradientStops: ['#1e3a5f', '#0f172a', '#1a1a3e'],
  },
  'evening-summary': {
    color: '#F97316',
    label: '夕刊Digest',
    emoji: '🗞️',
    dalleHint: 'dusk warm orange glow, neural network connections, sunset sky',
    gradientStops: ['#4a2010', '#0f172a', '#2d1b00'],
  },
  news: {
    color: '#6366F1',
    label: 'ニュース',
    emoji: '📰',
    dalleHint: 'indigo data streams, geometric patterns, light traces, digital flow',
    gradientStops: ['#1e1b4b', '#0f172a', '#1a1040'],
  },
  'dev-knowledge': {
    color: '#10b981',
    label: 'ナレッジ',
    emoji: '🧠',
    dalleHint: 'emerald code matrix, circuit board patterns, green glow, tech grid',
    gradientStops: ['#064e3b', '#0f172a', '#0a2e1f'],
  },
  'case-study': {
    color: '#f59e0b',
    label: '事例',
    emoji: '📊',
    dalleHint: 'amber growth visualization, warm gradient, abstract bar charts, success path',
    gradientStops: ['#451a03', '#0f172a', '#2d1b00'],
  },
  products: {
    color: '#8B5CF6',
    label: 'プロダクト',
    emoji: '🏷️',
    dalleHint: 'violet product aesthetic, clean tech showcase, polished surfaces',
    gradientStops: ['#2e1065', '#0f172a', '#1a0a3e'],
  },
};

const DEFAULT_THEME = CATEGORY_THEMES.news;

// ─── Env loading (reuse from sync-content-to-supabase.mjs) ────

function stripOuterQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return false;

  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    const rawValue = normalized.slice(separatorIndex + 1).trim();
    const value = stripOuterQuotes(rawValue).replace(/\\n/g, '\n');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  return true;
}

function loadProjectEnvFiles() {
  const loaded = [];
  for (const envFile of ENV_FILES) {
    if (loadEnvFile(envFile)) loaded.push(envFile);
  }
  return loaded;
}

// ─── Helpers ──────────────────────────────────────────────

function die(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function getCategory(data) {
  const ct = data.contentType;
  const de = data.digestEdition;
  const tags = Array.isArray(data.tags) ? data.tags : [];

  if (ct === 'digest') return de === 'evening' ? 'evening-summary' : 'morning-summary';
  if (ct === 'product') return 'products';
  if (tags.includes('case-study')) return 'case-study';
  if (tags.includes('dev-knowledge')) return 'dev-knowledge';
  return 'news';
}

function getTheme(category) {
  return CATEGORY_THEMES[category] || DEFAULT_THEME;
}

function listArticles() {
  if (!fs.existsSync(NEWS_DIR)) return [];
  return fs
    .readdirSync(NEWS_DIR)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((filename) => {
      const filePath = path.join(NEWS_DIR, filename);
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(raw);
      const slug = data.slug || filename.replace(/\.mdx?$/, '');
      return { filename, filePath, slug, data, content };
    });
}

// ─── DB article fetch (for DB-only articles) ─────────────

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function fetchArticleFromDb(slug) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: row, error } = await supabase
    .from('contents')
    .select('slug, title, description, content_type, hero_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !row) return null;

  // Fetch digest edition if applicable
  let digestEdition = null;
  if (row.content_type === 'digest') {
    const { data: dd } = await supabase
      .from('digest_details')
      .select('edition')
      .eq('content_id', (await supabase.from('contents').select('id').eq('slug', slug).single()).data?.id)
      .single();
    digestEdition = dd?.edition || 'morning';
  }

  // Fetch tags
  const { data: contentRow } = await supabase.from('contents').select('id').eq('slug', slug).single();
  let tags = [];
  if (contentRow) {
    const { data: ctRows } = await supabase.from('content_tags').select('tag_id').eq('content_id', contentRow.id);
    if (ctRows && ctRows.length > 0) {
      const tagIds = ctRows.map((r) => r.tag_id);
      const { data: tagRows } = await supabase.from('tags').select('code').in('id', tagIds);
      tags = (tagRows || []).map((r) => r.code);
    }
  }

  return {
    slug: row.slug,
    data: {
      title: row.title,
      description: row.description,
      contentType: row.content_type,
      digestEdition,
      image: row.hero_image_url,
      tags,
    },
    filePath: null, // DB-only article, no local file
    source: 'db',
  };
}

async function fetchAllArticlesFromDb() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data: rows, error } = await supabase
    .from('contents')
    .select('id, slug, title, description, content_type, hero_image_url')
    .eq('status', 'published')
    .order('date', { ascending: false });

  if (error || !rows) return [];

  // Fetch digest editions
  const contentIds = rows.map((r) => r.id);
  const { data: ddRows } = await supabase.from('digest_details').select('content_id, edition').in('content_id', contentIds);
  const editionMap = new Map((ddRows || []).map((r) => [r.content_id, r.edition]));

  // Fetch tags
  const { data: ctRows } = await supabase.from('content_tags').select('content_id, tag_id').in('content_id', contentIds);
  const tagIdSet = new Set((ctRows || []).map((r) => r.tag_id));
  let tagCodeMap = new Map();
  if (tagIdSet.size > 0) {
    const { data: tagRows } = await supabase.from('tags').select('id, code').in('id', [...tagIdSet]);
    tagCodeMap = new Map((tagRows || []).map((r) => [r.id, r.code]));
  }
  const tagsByContent = new Map();
  for (const r of ctRows || []) {
    const code = tagCodeMap.get(r.tag_id);
    if (!code) continue;
    const arr = tagsByContent.get(r.content_id) || [];
    arr.push(code);
    tagsByContent.set(r.content_id, arr);
  }

  return rows.map((row) => ({
    slug: row.slug,
    data: {
      title: row.title,
      description: row.description,
      contentType: row.content_type,
      digestEdition: editionMap.get(row.id) || null,
      image: row.hero_image_url,
      tags: tagsByContent.get(row.id) || [],
    },
    filePath: null,
    source: 'db',
  }));
}

// ─── SVG fallback background (no AI) ─────────────────────

function generateFallbackSvg(theme, width, height) {
  const [c1, c2, c3] = theme.gradientStops;
  // Geometric grid pattern + gradient
  const gridLines = [];
  for (let x = 0; x < width; x += 60) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${theme.color}15" stroke-width="1"/>`);
  }
  for (let y = 0; y < height; y += 60) {
    gridLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${theme.color}15" stroke-width="1"/>`);
  }

  // Accent circles
  const circles = [
    `<circle cx="${width * 0.75}" cy="${height * 0.3}" r="120" fill="${theme.color}08"/>`,
    `<circle cx="${width * 0.25}" cy="${height * 0.7}" r="80" fill="${theme.color}0a"/>`,
    `<circle cx="${width * 0.6}" cy="${height * 0.6}" r="200" fill="${theme.color}05"/>`,
  ];

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  ${gridLines.join('\n  ')}
  ${circles.join('\n  ')}
</svg>`;
}

// ─── DALL-E 3 background generation ──────────────────────

async function generateDalleBackground(theme, title) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey });

  // Extract keywords from title for visual hints
  const keywords = title
    .replace(/[「」『』（）\(\)【】]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 5)
    .join(', ');

  const prompt = [
    'Abstract technology background for a news article thumbnail.',
    `Dark navy base (#0f172a), ${theme.dalleHint}.`,
    `Visual theme inspired by: ${keywords}.`,
    'No text, no letters, no words, no numbers.',
    'Clean minimal composition, 4K quality, subtle glow effects.',
    'Professional tech blog aesthetic.',
  ].join(' ');

  console.log(`  🎨 DALL-E prompt: ${prompt.slice(0, 100)}...`);

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    response_format: 'url',
  });

  const imageUrl = response.data[0]?.url;
  if (!imageUrl) throw new Error('DALL-E returned no image URL');

  // Download the image
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download DALL-E image: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Text wrapping for SVG ───────────────────────────────

function wrapText(text, maxCharsPerLine) {
  const lines = [];
  let current = '';

  for (const char of text) {
    current += char;
    if (current.length >= maxCharsPerLine) {
      // Try to break at natural points
      const lastSpace = current.lastIndexOf(' ');
      const lastJpBreak = Math.max(
        current.lastIndexOf('、'),
        current.lastIndexOf('。'),
        current.lastIndexOf('・'),
        current.lastIndexOf('）'),
        current.lastIndexOf('」'),
      );
      const breakAt = Math.max(lastSpace, lastJpBreak);
      if (breakAt > 0 && breakAt > current.length * 0.4) {
        lines.push(current.slice(0, breakAt + 1).trim());
        current = current.slice(breakAt + 1);
      } else {
        lines.push(current.trim());
        current = '';
      }
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 3); // Max 3 lines
}

// ─── Sharp composite with text overlay ───────────────────

async function compositeImage(backgroundBuffer, title, theme, category) {
  const paddingX = 60;
  const paddingBottom = 50;
  const titleFontSize = 42;
  const maxCharsPerLine = 22;

  const titleLines = wrapText(title, maxCharsPerLine);
  const lineHeight = titleFontSize * 1.4;
  const titleBlockHeight = titleLines.length * lineHeight;

  // Badge dimensions (no emoji — Sharp/Pango cannot render emoji in SVG)
  const badgeText = theme.label;
  const badgeFontSize = 20;
  const badgePaddingX = 16;
  const badgePaddingY = 8;
  const badgeWidth = badgeText.length * badgeFontSize * 0.6 + badgePaddingX * 2;
  const badgeHeight = badgeFontSize + badgePaddingY * 2;

  // Position from bottom
  const titleBottomY = HEIGHT - paddingBottom;
  const titleTopY = titleBottomY - titleBlockHeight;
  const badgeY = titleTopY - badgeHeight - 16;

  // Site name
  const siteNameY = badgeY - 30;

  // Build SVG overlay
  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="${paddingX}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');

  const overlaySvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0"/>
      <stop offset="30%" stop-color="#0f172a" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
    </linearGradient>
  </defs>

  <!-- Gradient overlay -->
  <rect x="0" y="${HEIGHT * 0.25}" width="${WIDTH}" height="${HEIGHT * 0.75}" fill="url(#bottomFade)"/>

  <!-- Site name -->
  <text x="${paddingX}" y="${siteNameY}" font-family="sans-serif" font-size="16" font-weight="600" fill="#94a3b8" letter-spacing="2">
    AI SOLO BUILDER
  </text>

  <!-- Category badge -->
  <rect x="${paddingX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="14" fill="${theme.color}33"/>
  <text x="${paddingX + badgePaddingX}" y="${badgeY + badgeFontSize + badgePaddingY - 3}" font-family="sans-serif" font-size="${badgeFontSize}" font-weight="600" fill="${theme.color}">
    ${escapeXml(badgeText)}
  </text>

  <!-- Title -->
  <text x="${paddingX}" y="${titleTopY + titleFontSize}" font-family="sans-serif" font-size="${titleFontSize}" font-weight="800" fill="#e2e8f0">
    ${titleTspans}
  </text>
</svg>`;

  // Composite: background → resize → overlay
  const resizedBg = await sharp(backgroundBuffer)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .toBuffer();

  return sharp(resizedBg)
    .composite([
      {
        input: Buffer.from(overlaySvg),
        top: 0,
        left: 0,
      },
    ])
    .png({ quality: 90 })
    .toBuffer();
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Frontmatter update ──────────────────────────────────

function updateFrontmatterImage(filePath, newImagePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  data.image = newImagePath;
  const updated = matter.stringify(content, data);
  fs.writeFileSync(filePath, updated);
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const slugFlag = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
  const missingFlag = args.includes('--missing');
  const allFlag = args.includes('--all');
  const dryRun = args.includes('--dry-run');
  const noAi = args.includes('--no-ai');

  if (!slugFlag && !missingFlag && !allFlag) {
    die('Usage: --slug <slug> | --missing | --all [--dry-run] [--no-ai]');
  }

  // Load env
  const envLoaded = loadProjectEnvFiles();
  if (envLoaded.length > 0) {
    console.log(`📂 Env loaded: ${envLoaded.join(', ')}`);
  }

  if (!noAi && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not found. Using --no-ai fallback mode.\n');
  }

  const useAi = !noAi && Boolean(process.env.OPENAI_API_KEY);

  // Ensure output dir
  if (!dryRun) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // List articles from local files
  const localArticles = listArticles();
  const localSlugs = new Set(localArticles.map((a) => a.slug));

  // Merge with DB articles (DB-only ones that don't exist locally)
  let dbArticles = [];
  if (getSupabaseClient()) {
    try {
      const allDb = await fetchAllArticlesFromDb();
      dbArticles = allDb.filter((a) => !localSlugs.has(a.slug));
      console.log(`📄 Local articles: ${localArticles.length}, DB-only articles: ${dbArticles.length}`);
    } catch (err) {
      console.warn(`⚠️  DB fetch failed: ${err.message}. Using local files only.`);
    }
  } else {
    console.log(`📄 Local articles: ${localArticles.length} (DB not configured)`);
  }

  const allArticles = [...localArticles, ...dbArticles];
  console.log(`📄 Total articles: ${allArticles.length}\n`);

  // Filter
  let targets;
  if (slugFlag) {
    targets = allArticles.filter((a) => a.slug === slugFlag);
    if (targets.length === 0) {
      // Try fetching single article from DB
      const dbArticle = await fetchArticleFromDb(slugFlag);
      if (dbArticle) {
        targets = [dbArticle];
      } else {
        die(`Article not found: ${slugFlag}`);
      }
    }
  } else if (missingFlag) {
    targets = allArticles.filter((a) => {
      const img = a.data.image || '';
      return !img.startsWith('/thumbnails/');
    });
  } else {
    targets = allArticles;
  }

  console.log(`🎯 Target articles: ${targets.length}`);
  if (dryRun) {
    console.log('\n--- DRY RUN ---');
    for (const t of targets) {
      const cat = getCategory(t.data);
      const theme = getTheme(cat);
      console.log(`  ${t.slug} [${theme.label}] → /thumbnails/${t.slug}.png`);
    }
    console.log(`\n${targets.length} articles would be processed.`);
    return;
  }

  console.log(`🔧 Mode: ${useAi ? 'DALL-E 3 + Sharp' : 'Fallback (SVG gradient + Sharp)'}\n`);

  let success = 0;
  let failed = 0;

  for (const article of targets) {
    const { slug, data, filePath } = article;
    const title = data.title || slug;
    const category = getCategory(data);
    const theme = getTheme(category);
    const outputPath = path.join(OUTPUT_DIR, `${slug}.png`);

    console.log(`⏳ [${success + failed + 1}/${targets.length}] ${slug}`);

    try {
      let backgroundBuffer;

      if (useAi) {
        try {
          backgroundBuffer = await generateDalleBackground(theme, title);
        } catch (err) {
          console.warn(`  ⚠️  DALL-E failed (${err.message}). Using fallback.`);
          const fallbackSvg = generateFallbackSvg(theme, WIDTH, HEIGHT);
          backgroundBuffer = await sharp(Buffer.from(fallbackSvg)).png().toBuffer();
        }
      } else {
        const fallbackSvg = generateFallbackSvg(theme, WIDTH, HEIGHT);
        backgroundBuffer = await sharp(Buffer.from(fallbackSvg)).png().toBuffer();
      }

      // Composite with text overlay
      const finalImage = await compositeImage(backgroundBuffer, title, theme, category);
      fs.writeFileSync(outputPath, finalImage);

      // Update frontmatter (skip for DB-only articles)
      const newImagePath = `/thumbnails/${slug}.png`;
      if (filePath) {
        updateFrontmatterImage(filePath, newImagePath);
      }

      const sizeMb = (finalImage.length / 1024 / 1024).toFixed(2);
      console.log(`  ✅ ${newImagePath} (${sizeMb} MB)`);
      success++;
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`✅ Success: ${success}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
