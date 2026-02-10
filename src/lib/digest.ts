import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const newsDirectory = path.join(process.cwd(), 'content/news');

export type DigestCategory = 'morning-summary' | 'evening-summary';

export interface DigestMeta {
  title: string;
  slug: string;
  date: string;
  category: DigestCategory;
}

export interface DigestRankingItem {
  rank: number;
  nva: number;
  title: string;
  newsUrl?: string;
  sourceUrl?: string;
  relatedProductUrl?: string;
}

export interface DigestRanking {
  digest: DigestMeta;
  items: DigestRankingItem[];
}

function parseMarkdownLink(cell: string): { text: string; url?: string } {
  // Very small parser: supports a single markdown link [text](url).
  const m = cell.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!m) return { text: cell.trim() };
  return { text: m[1].trim(), url: m[2].trim() };
}

function parseIntLoose(s: string): number {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function extractRankingTable(markdown: string): string[] {
  const lines = markdown.split('\n');
  const header = '## 🏁 重要ニュースランキング（NVA）';
  let foundHeader = false;
  let tableStarted = false;
  const tableLines: string[] = [];

  for (const line of lines) {
    if (!foundHeader) {
      if (line.trim() === header) foundHeader = true;
      continue;
    }

    if (!tableStarted) {
      if (line.trim().startsWith('|')) {
        tableStarted = true;
        tableLines.push(line);
      }
      continue;
    }

    if (!line.trim().startsWith('|')) break;
    tableLines.push(line);
  }

  return tableLines;
}

function parseRankingItems(markdown: string): DigestRankingItem[] {
  const tableLines = extractRankingTable(markdown);
  if (tableLines.length < 2) return [];

  const headerCells = tableLines[0]
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());

  const idxRank = headerCells.findIndex((c) => c.includes('順位'));
  const idxNva = headerCells.findIndex((c) => c.toUpperCase().includes('NVA'));
  const idxNews = headerCells.findIndex((c) => c.includes('ニュース'));
  const idxSource = headerCells.findIndex((c) => c.includes('出典'));
  const idxRelatedProduct = headerCells.findIndex((c) => c.includes('関連') && c.includes('プロダクト'));

  const dataLines = tableLines.slice(1).filter((line) => !line.includes('---'));

  const items: DigestRankingItem[] = [];
  for (const line of dataLines) {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    const rankCell = cells[idxRank >= 0 ? idxRank : 0] || '';
    const nvaCell = cells[idxNva >= 0 ? idxNva : 1] || '';
    const newsCell = cells[idxNews >= 0 ? idxNews : 2] || '';
    const sourceCell = idxSource >= 0 ? (cells[idxSource] || '') : '';
    const productCell = idxRelatedProduct >= 0 ? (cells[idxRelatedProduct] || '') : '';

    const news = parseMarkdownLink(newsCell);
    const source = parseMarkdownLink(sourceCell);
    const relatedProduct = parseMarkdownLink(productCell);

    items.push({
      rank: parseIntLoose(rankCell),
      nva: parseIntLoose(nvaCell),
      title: news.text,
      newsUrl: news.url,
      sourceUrl: source.url,
      relatedProductUrl: relatedProduct.url,
    });
  }

  // Keep stable sort order if ranks are missing.
  return items
    .filter((i) => i.title.length > 0)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .slice(0, 10);
}

export function getLatestDigestRanking(category: DigestCategory): DigestRanking | null {
  if (!fs.existsSync(newsDirectory)) return null;

  const files = fs.readdirSync(newsDirectory).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

  const digests: { meta: DigestMeta; content: string }[] = [];

  for (const file of files) {
    const fullPath = path.join(newsDirectory, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(raw);

    const fileCategory = String(data.category || '').trim();
    if (fileCategory !== category) continue;

    const slug = String(data.slug || file.replace(/\.mdx?$/, '')).trim();
    const title = String(data.title || '').trim();
    const date = String(data.date || '').trim();
    if (!slug || !date) continue;

    digests.push({
      meta: { slug, title, date, category },
      content,
    });
  }

  if (digests.length === 0) return null;

  digests.sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());
  const latest = digests[0];

  return {
    digest: latest.meta,
    items: parseRankingItems(latest.content),
  };
}

