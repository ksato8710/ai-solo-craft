import { z } from 'zod';

export const ArticleTypeSchema = z.enum([
  'digest_morning',
  'digest_evening',
  'news',
  'product',
  'dev-knowledge',
  'case-study',
]);

export const ArticleStatusSchema = z.enum([
  'draft',
  'review',
  'published',
  'archived',
]);

export const ListArticlesSchema = z.object({
  type: ArticleTypeSchema.optional().describe('記事タイプでフィルタ'),
  status: ArticleStatusSchema.optional().describe('ステータスでフィルタ'),
  limit: z.number().int().min(1).max(50).default(20).describe('取得件数上限'),
});

export const GetArticleSchema = z
  .object({
    id: z.string().min(1).optional().describe('記事ID'),
    slug: z.string().min(1).optional().describe('記事スラッグ'),
  })
  .refine((value) => Boolean(value.id || value.slug), {
    message: 'id または slug のいずれかは必須です',
  });

export const CreateArticleSchema = z.object({
  title: z.string().min(1).max(200).describe('記事タイトル'),
  body: z.string().min(1).describe('本文（Markdown）'),
  type: ArticleTypeSchema.describe('記事タイプ'),
  tags: z.array(z.string().min(1)).optional().default([]).describe('タグ配列'),
});

export const UpdateArticleStatusSchema = z.object({
  id: z.string().min(1).describe('記事ID'),
  status: ArticleStatusSchema.describe('新しいステータス'),
});

export const SearchArticlesSchema = z.object({
  keyword: z.string().min(1).describe('検索キーワード（タイトル・本文にマッチ）'),
  limit: z.number().int().min(1).max(50).default(20).describe('取得件数上限'),
});

export type ArticleType = z.infer<typeof ArticleTypeSchema>;
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;
export type ListArticlesInput = z.infer<typeof ListArticlesSchema>;
export type GetArticleInput = z.infer<typeof GetArticleSchema>;
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type UpdateArticleStatusInput = z.infer<typeof UpdateArticleStatusSchema>;
export type SearchArticlesInput = z.infer<typeof SearchArticlesSchema>;
