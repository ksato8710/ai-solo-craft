BEGIN;

-- 新しいsource_typeの値を追加（既存の値も保持）
DO $$ BEGIN
  BEGIN
    ALTER TYPE public.source_type ADD VALUE 'primary';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER TYPE public.source_type ADD VALUE 'secondary';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER TYPE public.source_type ADD VALUE 'tertiary';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- verification_level ENUMを作成
DO $$ BEGIN
  CREATE TYPE public.verification_level AS ENUM ('official', 'editorial', 'community');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- sourcesテーブルに信頼性関連フィールドを追加
ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS credibility_score integer CHECK (credibility_score >= 1 AND credibility_score <= 10),
ADD COLUMN IF NOT EXISTS verification_level public.verification_level,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS website_url text;

-- domainフィールドにユニーク制約を追加（既存データがある場合は後で更新）
CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_domain_unique 
ON public.sources (domain) 
WHERE domain IS NOT NULL;

-- contentsテーブルにソース関連フィールドを追加
ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS primary_source_id uuid REFERENCES public.sources(id),
ADD COLUMN IF NOT EXISTS source_credibility_score integer,
ADD COLUMN IF NOT EXISTS source_verification_note text;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_sources_credibility_score ON public.sources (credibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_sources_verification_level ON public.sources (verification_level);
CREATE INDEX IF NOT EXISTS idx_contents_primary_source ON public.contents (primary_source_id);

-- updated_atトリガーが既存のsourcesテーブルに適用されていることを確認
-- （既に作成済みなので再作成しない）

COMMIT;