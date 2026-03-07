export type ContentType = 'news' | 'product' | 'digest';
export type DigestEdition = 'morning' | 'evening' | null;

export interface SourceInfo {
  id?: string;
  name?: string;
  domain?: string;
  type?: 'primary' | 'secondary' | 'tertiary' | 'official' | 'media' | 'community' | 'social' | 'other';
  credibility_score?: number;
  verification_level?: 'official' | 'editorial' | 'community';
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  description: string;
  readTime: number;
  featured: boolean;
  image?: string;
  content?: string;
  htmlContent?: string;
  type: 'news' | 'product';
  url: string;
  relatedProduct?: string;
  relatedProducts?: string[];
  tags?: string[];
  contentType?: ContentType;
  digestEdition?: DigestEdition;
  source?: SourceInfo;
}

export const CATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  'morning-summary': { label: '朝のまとめ', color: '#7E9AAB', emoji: '🗞️' },
  news: { label: 'ニュース', color: '#7E9AAB', emoji: '📰' },
  'dev-knowledge': { label: 'AI開発ナレッジ', color: '#6B8F71', emoji: '🧠' },
  'case-study': { label: '個人開発者事例', color: '#B8956A', emoji: '📊' },
  products: { label: 'プロダクト', color: '#6B8F71', emoji: '🏷️' },
};

export const NEWS_SUBCATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  news: { label: 'ニュース', color: '#7E9AAB', emoji: '📰' },
  'dev-knowledge': { label: 'ナレッジ', color: '#6B8F71', emoji: '🧠' },
  'case-study': { label: '事例', color: '#B8956A', emoji: '📊' },
};

export interface TagMeta {
  label: string;
  color: string;
}

export const TAG_METADATA: Record<string, TagMeta> = {
  // News tags
  'dev-knowledge': { label: 'ナレッジ', color: '#6B8F71' },
  'case-study': { label: '事例', color: '#B8956A' },
  'product-update': { label: 'ツール紹介', color: '#6B8F71' },
  'ツール紹介': { label: 'ツール紹介', color: '#6B8F71' },
  'other': { label: 'その他', color: '#8A9E8C' },
};

// Product category tags — Tonal Groups (Leaf / Sage / Bark)
export const PRODUCT_TAGS: Record<string, TagMeta> = {
  // Leaf Group (backend, infra, success)
  'ai-coding': { label: 'AIコーディング', color: '#6B8F71' },
  'ai-data': { label: 'データ分析', color: '#6B8F71' },
  'ai-productivity': { label: '生産性向上', color: '#4A7051' },
  'developer-tools': { label: '開発ツール', color: '#4A7051' },
  'automation': { label: '自動化', color: '#6B8F71' },
  // Sage Group (frontend, frameworks, info)
  'ai-ide': { label: 'AI IDE', color: '#9BB09E' },
  'ai-chat': { label: 'AIチャット', color: '#7E9AAB' },
  'ai-search': { label: 'AI検索', color: '#7E9AAB' },
  'ai-agent': { label: 'AIエージェント', color: '#9BB09E' },
  'ai-meeting': { label: '会議・議事録', color: '#9BB09E' },
  // Bark Group (creative, content, build)
  'ai-image': { label: '画像生成', color: '#C4926B' },
  'ai-video': { label: '動画生成', color: '#C4926B' },
  'ai-audio': { label: '音声・音楽', color: '#8B7355' },
  'ai-writing': { label: '文章作成', color: '#B8956A' },
  'ai-design': { label: 'AIデザイン', color: '#C4926B' },
  'ai-marketing': { label: 'マーケティング', color: '#C45D5D' },
  'no-code': { label: 'ノーコード', color: '#B8956A' },
  'ai-presentation': { label: 'プレゼン', color: '#8B7355' },
};

const DEFAULT_NEWS_BADGE: TagMeta = { label: 'その他', color: '#8A9E8C' };

export function getPostBadge(post: Post): { label: string; color: string } {
  const cat = CATEGORIES[post.category];
  // Digests and products use category badge as-is
  if (post.category !== 'news') return cat || DEFAULT_NEWS_BADGE;
  // News articles: derive badge from first recognized tag
  if (post.tags) {
    for (const tag of post.tags) {
      const meta = TAG_METADATA[tag];
      if (meta) return meta;
    }
  }
  return DEFAULT_NEWS_BADGE;
}
