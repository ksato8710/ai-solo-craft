import fs from 'fs';
import path from 'path';

const researchDirectory = path.join(process.cwd(), 'research');
const contentDirectory = path.join(process.cwd(), 'content/news');

export interface NewsValueScore {
  slug: string;
  productName: string;
  date: string;
  articleSlug: string;
  articleTitle: string;
  snsScore: number;
  mediaScore: number;
  communityScore: number;
  techImpactScore: number;
  soloBuilderScore: number;
  totalScore: number;
  tier: string;
  summary: string;
}

function parseTier(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 55) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

function extractScore(line: string): number {
  // Match patterns like "12/20", "17/20"
  const match = line.match(/(\d+)\s*\/\s*20/);
  return match ? parseInt(match[1], 10) : 0;
}

// Map research folder slugs to human-readable names and article slugs
function buildProductNameMap(): Record<string, { name: string; articleSlug: string; articleTitle: string }> {
  const map: Record<string, { name: string; articleSlug: string; articleTitle: string }> = {};
  
  // Read all articles to build title lookup
  if (fs.existsSync(contentDirectory)) {
    const files = fs.readdirSync(contentDirectory).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(contentDirectory, file), 'utf8');
      const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const slugMatch = content.match(/^slug:\s*["']?(.+?)["']?\s*$/m);
      const title = titleMatch ? titleMatch[1] : file.replace(/\.mdx?$/, '');
      const slug = slugMatch ? slugMatch[1] : file.replace(/\.mdx?$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
      
      // Map filename (without extension) to article info
      const basename = file.replace(/\.mdx?$/, '');
      map[basename] = { name: title, articleSlug: slug, articleTitle: title };
    }
  }
  return map;
}

// Hardcoded readable names for research topics that don't directly map to articles
const PRODUCT_NAMES: Record<string, string> = {
  '2026-02-02-adcreative-ai-ad-creative-generator': 'AdCreative.ai — AI広告クリエイティブ自動生成',
  '2026-02-02-ai-solo-builder-era-2026': 'AIソロビルダーの時代が来た（オリジナル）',
  '2026-02-02-bolt-new-ai-app-builder': 'Bolt.new — ブラウザ完結AIアプリ開発',
  '2026-02-02-claude-cowork-plugins-solo-team': 'Claude Cowork Plugins — AIチーム協業',
  '2026-02-02-elevenlabs-ai-voice-generation': 'ElevenLabs — AI音声生成・ボイスクローン',
  '2026-02-02-fathom-ai-meeting-assistant': 'Fathom — AI会議アシスタント',
  '2026-02-02-gamma-ai-presentation-builder': 'Gamma — AIプレゼンテーション作成',
  '2026-02-02-jasper-ai-marketing-platform': 'Jasper — AIマーケティングプラットフォーム',
  '2026-02-02-julius-ai-data-analysis': 'Julius AI — 自然言語データ分析',
  '2026-02-02-lovable-ai-web-app-builder': 'Lovable — AIウェブアプリビルダー',
  '2026-02-02-manus-autonomous-ai-agent': 'Manus — 自律型AIエージェント（Meta買収）',
  '2026-02-02-midjourney-ai-image-generation': 'Midjourney — AI画像生成',
  '2026-02-02-morning-news-2026-02-02-vibe-coding': '朝刊 2/2 — バイブコーディング特集',
  '2026-02-02-n8n-ai-workflow-automation': 'n8n — AIワークフロー自動化',
  '2026-02-02-perplexity-ai-search-engine': 'Perplexity — AI検索エンジン',
  '2026-02-02-pieter-levels-solo-founder-strategy': 'Pieter Levels — 年収3億円ソロファウンダー戦略',
  '2026-02-02-runway-ai-video-generation': 'Runway — AI動画生成',
  '2026-02-02-suno-ai-music-generation': 'Suno — AI音楽生成',
  '2026-02-02-windsurf-ai-coding-ide': 'Windsurf — AIコーディングIDE',
  '2026-02-03-kimi-k25-kimi-code': 'Kimi K2.5 + Kimi Code — 1兆パラメータOSSモデル',
  '2026-02-03-morning-news-2026-02-03': '朝刊 2/3 — Codexデスクトップ・SpaceX×xAI',
  '2026-02-03-noon-tools-2026-02-03': '昼刊 2/3 — Kimi K2.5 & OpenAI Prism',
  '2026-02-03-openai-codex-complete-guide': 'OpenAI Codex — デスクトップアプリ完全ガイド',
  '2026-02-03-openai-prism': 'OpenAI Prism — 科学者向けLaTeXエディタ',
};

// Map research slug to article slug
const ARTICLE_SLUG_MAP: Record<string, string> = {
  '2026-02-02-adcreative-ai-ad-creative-generator': 'adcreative-ai-ad-creative-generator',
  '2026-02-02-bolt-new-ai-app-builder': 'bolt-new-ai-app-builder',
  '2026-02-02-claude-cowork-plugins-solo-team': 'claude-cowork-plugins-solo-team',
  '2026-02-02-elevenlabs-ai-voice-generation': 'elevenlabs-ai-voice-generation',
  '2026-02-02-fathom-ai-meeting-assistant': 'fathom-ai-meeting-assistant',
  '2026-02-02-gamma-ai-presentation-builder': 'gamma-ai-presentation-builder',
  '2026-02-02-jasper-ai-marketing-platform': 'jasper-ai-marketing-platform',
  '2026-02-02-julius-ai-data-analysis': 'julius-ai-data-analysis',
  '2026-02-02-lovable-ai-web-app-builder': 'lovable-ai-web-app-builder',
  '2026-02-02-manus-autonomous-ai-agent': 'manus-autonomous-ai-agent',
  '2026-02-02-midjourney-ai-image-generation': 'midjourney-ai-image-generation',
  '2026-02-02-morning-news-2026-02-02-vibe-coding': 'morning-news-2026-02-02-vibe-coding',
  '2026-02-02-n8n-ai-workflow-automation': 'n8n-ai-workflow-automation',
  '2026-02-02-perplexity-ai-search-engine': 'perplexity-ai-search-engine',
  '2026-02-02-pieter-levels-solo-founder-strategy': 'pieter-levels-solo-founder-strategy',
  '2026-02-02-runway-ai-video-generation': 'runway-ai-video-generation',
  '2026-02-02-suno-ai-music-generation': 'suno-ai-music-generation',
  '2026-02-02-windsurf-ai-coding-ide': 'windsurf-ai-coding-ide',
  '2026-02-03-kimi-k25-kimi-code': 'noon-tools-2026-02-03',
  '2026-02-03-morning-news-2026-02-03': 'morning-news-2026-02-03',
  '2026-02-03-noon-tools-2026-02-03': 'noon-tools-2026-02-03',
  '2026-02-03-openai-codex-complete-guide': 'openai-codex-complete-guide',
  '2026-02-03-openai-prism': 'noon-tools-2026-02-03',
};

export function getAllAssessments(): NewsValueScore[] {
  if (!fs.existsSync(researchDirectory)) return [];

  const dirs = fs.readdirSync(researchDirectory).filter(d => {
    const full = path.join(researchDirectory, d);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'assessment.md'));
  });

  const assessments: NewsValueScore[] = [];

  for (const dir of dirs) {
    const assessmentPath = path.join(researchDirectory, dir, 'assessment.md');
    const content = fs.readFileSync(assessmentPath, 'utf8');

    // Skip "対象外" (original content)
    if (content.includes('対象外')) continue;

    // Use hardcoded name or fallback to directory name
    const productName = PRODUCT_NAMES[dir] || dir;
    const articleSlug = ARTICLE_SLUG_MAP[dir] || '';

    // Extract date from dir name
    const dateMatch = dir.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract all scores from the content
    const lines = content.split('\n');
    let sns = 0, media = 0, community = 0, tech = 0, solo = 0;

    for (const line of lines) {
      const score = extractScore(line);
      if (score === 0) continue;

      const lower = line.toLowerCase();
      if (lower.includes('sns') || lower.includes('反応量')) {
        sns = score;
      } else if (lower.includes('メディア') || lower.includes('カバレッジ')) {
        media = score;
      } else if (lower.includes('コミュニティ')) {
        community = score;
      } else if (lower.includes('技術') || lower.includes('インパクト')) {
        tech = score;
      } else if (lower.includes('ソロビルダー') || lower.includes('関連度')) {
        solo = score;
      }
    }

    // For total: try to extract from "合計" row first, else sum
    let total = sns + media + community + tech + solo;
    const totalMatch = content.match(/合計[^|]*\|\s*\*?\*?(\d+)/);
    if (totalMatch) {
      total = parseInt(totalMatch[1], 10);
    }

    // Extract summary from "総合所見" section
    const summaryMatch = content.match(/総合所見\n\n(.+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    assessments.push({
      slug: dir,
      productName,
      date,
      articleSlug,
      articleTitle: productName,
      snsScore: sns,
      mediaScore: media,
      communityScore: community,
      techImpactScore: tech,
      soloBuilderScore: solo,
      totalScore: total,
      tier: parseTier(total),
      summary,
    });
  }

  return assessments.sort((a, b) => b.totalScore - a.totalScore);
}
