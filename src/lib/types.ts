export type ContentType = 'news' | 'product' | 'digest';
export type DigestEdition = 'morning' | 'evening' | null;

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
}

export const CATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  'morning-summary': { label: '朝のまとめ', color: '#3B82F6', emoji: '🗞️' },
  'evening-summary': { label: '夕のまとめ', color: '#F97316', emoji: '🗞️' },
  news: { label: 'ニュース', color: '#6366F1', emoji: '📰' },
  'dev-knowledge': { label: 'AI開発ナレッジ', color: '#10b981', emoji: '🧠' },
  'case-study': { label: 'ソロビルダー事例', color: '#f59e0b', emoji: '📊' },
  products: { label: 'プロダクト', color: '#8B5CF6', emoji: '🏷️' },
};

export const NEWS_SUBCATEGORIES: Record<string, { label: string; color: string; emoji: string }> = {
  news: { label: 'ニュース', color: '#6366F1', emoji: '📰' },
  'dev-knowledge': { label: 'ナレッジ', color: '#10b981', emoji: '🧠' },
  'case-study': { label: '事例', color: '#f59e0b', emoji: '📊' },
};

export interface TagMeta {
  label: string;
  color: string;
}

export const TAG_METADATA: Record<string, TagMeta> = {
  'dev-knowledge': { label: 'ナレッジ', color: '#10b981' },
  'case-study': { label: '事例', color: '#f59e0b' },
  'product-update': { label: 'プロダクトアップデート', color: '#8B5CF6' },
  'other': { label: 'その他', color: '#64748b' },
};
