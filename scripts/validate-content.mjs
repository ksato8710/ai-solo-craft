import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const NEWS_DIR = path.join(ROOT, 'content', 'news');
const PRODUCTS_DIR = path.join(ROOT, 'content', 'products');

const ALLOWED_NEWS_CATEGORIES = new Set([
  'morning-summary',
  'evening-summary',
  'news',
  'dev-knowledge',
  'case-study',
]);

// Digest format became strict from this date onward.
// Older content may be legacy and can be migrated gradually.
const DIGEST_FORMAT_ENFORCE_FROM = '2026-02-10';

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => path.join(dir, f));
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

function assertRequiredFrontmatter(filePath, data, requiredKeys) {
  const missing = [];
  for (const k of requiredKeys) {
    if (data[k] === undefined || data[k] === null || String(data[k]).trim() === '') missing.push(k);
  }
  if (missing.length > 0) {
    die(`${filePath} is missing required frontmatter keys: ${missing.join(', ')}`);
  }
}

function extractProductSlugs() {
  const slugs = new Set();
  for (const filePath of listMarkdownFiles(PRODUCTS_DIR)) {
    const { data } = readFrontmatter(filePath);
    const slug = (data.slug || path.basename(filePath).replace(/\.mdx?$/, '')).toString().trim();
    if (!slug) die(`${filePath} has empty slug`);
    slugs.add(slug);

    const cat = (data.category || '').toString().trim();
    if (cat !== 'products') die(`${filePath} category must be "products" (got "${cat}")`);
  }
  return slugs;
}

function extractProductLinks(markdown) {
  const links = [];
  const re = /\/products\/([a-z0-9-]+)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    links.push(m[1]);
  }
  return links;
}

function hasDigestSections(rawMarkdown) {
  return rawMarkdown.includes('## 🏁 重要ニュースランキング（NVA）') && rawMarkdown.includes('## 🔥 Top 3 ピックアップ');
}

function hasRankingTable(rawMarkdown) {
  const header = '## 🏁 重要ニュースランキング（NVA）';
  const idx = rawMarkdown.indexOf(header);
  if (idx === -1) return false;
  const after = rawMarkdown.slice(idx + header.length);
  // Find the first table row after the header.
  return /\n\|.+\|\n\|[-| :]+\|\n\|.+\|/m.test(after);
}

function main() {
  const productSlugs = extractProductSlugs();

  const newsFiles = listMarkdownFiles(NEWS_DIR);
  if (newsFiles.length === 0) die('No content/news markdown files found');

  for (const filePath of newsFiles) {
    const { data, raw } = readFrontmatter(filePath);

    assertRequiredFrontmatter(filePath, data, ['title', 'slug', 'date', 'category', 'description', 'readTime']);

    const category = data.category.toString().trim();
    if (!ALLOWED_NEWS_CATEGORIES.has(category)) {
      die(`${filePath} has invalid category "${category}"`);
    }

    // Product link / relatedProduct must resolve.
    const links = extractProductLinks(raw);
    for (const slug of links) {
      if (!productSlugs.has(slug)) die(`${filePath} links to missing product slug "${slug}"`);
    }

    if (data.relatedProduct) {
      const rp = data.relatedProduct.toString().trim();
      if (!productSlugs.has(rp)) die(`${filePath} has relatedProduct "${rp}" but product page not found`);
    }

    // Digest format checks.
    if (category === 'morning-summary' || category === 'evening-summary') {
      const date = data.date?.toString().trim() || '';
      if (date && date >= DIGEST_FORMAT_ENFORCE_FROM) {
        if (!hasDigestSections(raw)) die(`${filePath} (Digest) is missing required sections`);
        if (!hasRankingTable(raw)) die(`${filePath} (Digest) is missing a valid ranking table under the NVA section`);
      }
    }
  }

  console.log('✅ validate-content: OK');
}

main();
