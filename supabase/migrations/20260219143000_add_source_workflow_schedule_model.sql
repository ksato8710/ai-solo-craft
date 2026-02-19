BEGIN;

-- ---------------------------------------------------------------------------
-- Extend sources table to handle newsletter / primary / Japanese media entities
-- ---------------------------------------------------------------------------
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS entity_kind text,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_newsletter boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_japanese_media boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter_from_email text,
  ADD COLUMN IF NOT EXISTS newsletter_archive_url text,
  ADD COLUMN IF NOT EXISTS notes text;

DO $$ BEGIN
  ALTER TABLE public.sources
    ADD CONSTRAINT chk_sources_entity_kind
    CHECK (
      entity_kind IS NULL OR entity_kind IN (
        'primary_source',
        'global_media',
        'japanese_media',
        'newsletter',
        'community',
        'social',
        'tool_directory'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.sources
    ADD CONSTRAINT chk_sources_locale
    CHECK (locale IN ('ja', 'en', 'multilingual', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.sources
    ADD CONSTRAINT chk_sources_region
    CHECK (region IN ('jp', 'global', 'us', 'eu', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_sources_entity_kind ON public.sources (entity_kind);
CREATE INDEX IF NOT EXISTS idx_sources_locale_region ON public.sources (locale, region);
CREATE INDEX IF NOT EXISTS idx_sources_active_entity ON public.sources (is_active, entity_kind);

UPDATE public.sources
SET
  entity_kind = CASE
    WHEN entity_kind IS NOT NULL THEN entity_kind
    WHEN source_type = 'primary' THEN 'primary_source'
    WHEN source_type IN ('secondary', 'media', 'official') THEN 'global_media'
    WHEN source_type IN ('tertiary', 'community') THEN 'community'
    WHEN source_type = 'social' THEN 'social'
    ELSE 'global_media'
  END,
  locale = COALESCE(locale, 'en'),
  region = COALESCE(region, 'global');

-- ---------------------------------------------------------------------------
-- Source delivery schedule model (newsletter arrival windows)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.source_delivery_schedules (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  schedule_name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Tokyo',
  delivery_hour smallint NOT NULL CHECK (delivery_hour BETWEEN 0 AND 23),
  delivery_minute smallint NOT NULL CHECK (delivery_minute BETWEEN 0 AND 59),
  delivery_days smallint[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  fetch_delay_minutes integer NOT NULL DEFAULT 20 CHECK (fetch_delay_minutes BETWEEN 0 AND 720),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, schedule_name)
);

CREATE INDEX IF NOT EXISTS idx_source_delivery_schedules_source_id ON public.source_delivery_schedules (source_id);
CREATE INDEX IF NOT EXISTS idx_source_delivery_schedules_active ON public.source_delivery_schedules (is_active);

DROP TRIGGER IF EXISTS trg_source_delivery_schedules_set_updated_at ON public.source_delivery_schedules;
CREATE TRIGGER trg_source_delivery_schedules_set_updated_at
BEFORE UPDATE ON public.source_delivery_schedules
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Workflow model: which source types are used for which article workflows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_workflows (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  workflow_code text NOT NULL UNIQUE,
  workflow_name text NOT NULL,
  content_type public.content_type NOT NULL,
  digest_edition public.digest_edition,
  article_tag text,
  objective text NOT NULL,
  output_contract text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.content_workflows
    ADD CONSTRAINT chk_content_workflows_digest_edition
    CHECK (
      (content_type = 'digest' AND digest_edition IS NOT NULL)
      OR
      (content_type <> 'digest' AND digest_edition IS NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_workflows_type ON public.content_workflows (content_type, is_active);

DROP TRIGGER IF EXISTS trg_content_workflows_set_updated_at ON public.content_workflows;
CREATE TRIGGER trg_content_workflows_set_updated_at
BEFORE UPDATE ON public.content_workflows
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.workflow_source_mappings (
  workflow_id uuid NOT NULL REFERENCES public.content_workflows(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('detect', 'verify', 'localize', 'benchmark')),
  priority smallint NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workflow_id, source_id, role)
);

CREATE INDEX IF NOT EXISTS idx_workflow_source_mappings_workflow ON public.workflow_source_mappings (workflow_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_source_mappings_source ON public.workflow_source_mappings (source_id);

-- ---------------------------------------------------------------------------
-- Seed trusted source entities (newsletter / Japanese media / primary)
-- ---------------------------------------------------------------------------
WITH seed_sources(
  name,
  url,
  domain,
  source_type,
  credibility_score,
  verification_level,
  description,
  entity_kind,
  locale,
  region,
  is_newsletter,
  is_japanese_media,
  newsletter_from_email,
  newsletter_archive_url,
  notes
) AS (
  VALUES
    -- Newsletters used as detection layer
    ('The Rundown AI', 'https://www.therundown.ai/', 'www.therundown.ai', 'secondary', 7, 'editorial', 'Global AI newsletter used for fast signal detection.', 'newsletter', 'en', 'global', true, false, 'news@daily.therundown.ai', 'https://www.therundown.ai/', 'Use as signal only. Always verify with first-party links.'),
    ('Superhuman', 'https://www.superhuman.ai/', 'www.superhuman.ai', 'secondary', 7, 'editorial', 'AI business and tooling newsletter.', 'newsletter', 'en', 'global', true, false, null, 'https://www.superhuman.ai/', 'Use for broad signal collection and tooling trends.'),
    ('Ben''s Bites', 'https://bensbites.co/', 'bensbites.co', 'secondary', 7, 'editorial', 'AI curation newsletter with product updates.', 'newsletter', 'en', 'global', true, false, null, 'https://bensbites.co/', 'Use as supplementary daily detector.'),
    ('TLDR AI', 'https://tldr.tech/ai', 'tldr.tech', 'secondary', 7, 'editorial', 'Daily AI digest for broader market moves.', 'newsletter', 'en', 'global', true, false, null, 'https://tldr.tech/ai', 'Useful for cross-checking broad consensus.'),

    -- Japanese media (localization/verification)
    ('日経クロステック', 'https://xtech.nikkei.com/', 'xtech.nikkei.com', 'secondary', 8, 'editorial', '日経BPの技術・DX専門メディア。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Enterprise and policy context in Japanese.'),
    ('ITmedia NEWS', 'https://www.itmedia.co.jp/news/', 'www.itmedia.co.jp', 'secondary', 7, 'editorial', 'IT・AI分野の国内ニュースメディア。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Strong for domestic framing and quick follow-up.'),
    ('Publickey', 'https://www.publickey1.jp/', 'www.publickey1.jp', 'secondary', 8, 'editorial', 'クラウド/開発者向け技術解説メディア。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Useful for developer-oriented contextualization.'),
    ('Impress Watch', 'https://www.watch.impress.co.jp/', 'www.watch.impress.co.jp', 'secondary', 7, 'editorial', '日本のテクノロジー総合ニュース。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Wide coverage across consumer and business tech.'),
    ('CNET Japan', 'https://japan.cnet.com/', 'japan.cnet.com', 'secondary', 7, 'editorial', '国内外テックニュースと分析。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Good for business-impact context in Japanese.'),

    -- Primary sources used for factual verification
    ('Anthropic News', 'https://www.anthropic.com/news', 'www.anthropic.com', 'primary', 10, 'official', 'Anthropic official announcements and model updates.', 'primary_source', 'en', 'global', false, false, null, null, 'Primary source for Claude model updates.'),
    ('OpenAI News', 'https://openai.com/news', 'openai.com', 'primary', 10, 'official', 'OpenAI official announcements.', 'primary_source', 'en', 'global', false, false, null, null, 'Primary source for OpenAI releases.'),
    ('Figma Blog', 'https://www.figma.com/blog/', 'www.figma.com', 'primary', 9, 'official', 'Figma official product and developer announcements.', 'primary_source', 'en', 'global', false, false, null, null, 'Primary source for Figma releases and integrations.')
)
UPDATE public.sources AS s
SET
  name = seed.name,
  url = seed.url,
  source_type = seed.source_type::public.source_type,
  credibility_score = seed.credibility_score,
  verification_level = seed.verification_level::public.verification_level,
  description = seed.description,
  entity_kind = seed.entity_kind,
  locale = seed.locale,
  region = seed.region,
  is_newsletter = seed.is_newsletter,
  is_japanese_media = seed.is_japanese_media,
  newsletter_from_email = seed.newsletter_from_email,
  newsletter_archive_url = seed.newsletter_archive_url,
  notes = seed.notes,
  is_active = true
FROM seed_sources AS seed
WHERE s.domain = seed.domain;

WITH seed_sources(
  name,
  url,
  domain,
  source_type,
  credibility_score,
  verification_level,
  description,
  entity_kind,
  locale,
  region,
  is_newsletter,
  is_japanese_media,
  newsletter_from_email,
  newsletter_archive_url,
  notes
) AS (
  VALUES
    ('The Rundown AI', 'https://www.therundown.ai/', 'www.therundown.ai', 'secondary', 7, 'editorial', 'Global AI newsletter used for fast signal detection.', 'newsletter', 'en', 'global', true, false, 'news@daily.therundown.ai', 'https://www.therundown.ai/', 'Use as signal only. Always verify with first-party links.'),
    ('Superhuman', 'https://www.superhuman.ai/', 'www.superhuman.ai', 'secondary', 7, 'editorial', 'AI business and tooling newsletter.', 'newsletter', 'en', 'global', true, false, null, 'https://www.superhuman.ai/', 'Use for broad signal collection and tooling trends.'),
    ('Ben''s Bites', 'https://bensbites.co/', 'bensbites.co', 'secondary', 7, 'editorial', 'AI curation newsletter with product updates.', 'newsletter', 'en', 'global', true, false, null, 'https://bensbites.co/', 'Use as supplementary daily detector.'),
    ('TLDR AI', 'https://tldr.tech/ai', 'tldr.tech', 'secondary', 7, 'editorial', 'Daily AI digest for broader market moves.', 'newsletter', 'en', 'global', true, false, null, 'https://tldr.tech/ai', 'Useful for cross-checking broad consensus.'),
    ('日経クロステック', 'https://xtech.nikkei.com/', 'xtech.nikkei.com', 'secondary', 8, 'editorial', '日経BPの技術・DX専門メディア。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Enterprise and policy context in Japanese.'),
    ('ITmedia NEWS', 'https://www.itmedia.co.jp/news/', 'www.itmedia.co.jp', 'secondary', 7, 'editorial', 'IT・AI分野の国内ニュースメディア。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Strong for domestic framing and quick follow-up.'),
    ('Publickey', 'https://www.publickey1.jp/', 'www.publickey1.jp', 'secondary', 8, 'editorial', 'クラウド/開発者向け技術解説メディア。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Useful for developer-oriented contextualization.'),
    ('Impress Watch', 'https://www.watch.impress.co.jp/', 'www.watch.impress.co.jp', 'secondary', 7, 'editorial', '日本のテクノロジー総合ニュース。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Wide coverage across consumer and business tech.'),
    ('CNET Japan', 'https://japan.cnet.com/', 'japan.cnet.com', 'secondary', 7, 'editorial', '国内外テックニュースと分析。', 'japanese_media', 'ja', 'jp', false, true, null, null, 'Good for business-impact context in Japanese.'),
    ('Anthropic News', 'https://www.anthropic.com/news', 'www.anthropic.com', 'primary', 10, 'official', 'Anthropic official announcements and model updates.', 'primary_source', 'en', 'global', false, false, null, null, 'Primary source for Claude model updates.'),
    ('OpenAI News', 'https://openai.com/news', 'openai.com', 'primary', 10, 'official', 'OpenAI official announcements.', 'primary_source', 'en', 'global', false, false, null, null, 'Primary source for OpenAI releases.'),
    ('Figma Blog', 'https://www.figma.com/blog/', 'www.figma.com', 'primary', 9, 'official', 'Figma official product and developer announcements.', 'primary_source', 'en', 'global', false, false, null, null, 'Primary source for Figma releases and integrations.')
)
INSERT INTO public.sources (
  name,
  url,
  domain,
  source_type,
  credibility_score,
  verification_level,
  description,
  entity_kind,
  locale,
  region,
  is_newsletter,
  is_japanese_media,
  newsletter_from_email,
  newsletter_archive_url,
  notes,
  is_active
)
SELECT
  seed.name,
  seed.url,
  seed.domain,
  seed.source_type::public.source_type,
  seed.credibility_score,
  seed.verification_level::public.verification_level,
  seed.description,
  seed.entity_kind,
  seed.locale,
  seed.region,
  seed.is_newsletter,
  seed.is_japanese_media,
  seed.newsletter_from_email,
  seed.newsletter_archive_url,
  seed.notes,
  true
FROM seed_sources AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.sources existing
  WHERE existing.domain = seed.domain
);

-- ---------------------------------------------------------------------------
-- Seed delivery schedules for newsletter sources
-- ---------------------------------------------------------------------------
WITH seed_schedules(domain, schedule_name, timezone, delivery_hour, delivery_minute, delivery_days, fetch_delay_minutes, is_active) AS (
  VALUES
    ('www.therundown.ai', 'daily_primary', 'Asia/Tokyo', 20, 10, ARRAY[1,2,3,4,5,6,0]::smallint[], 20, true),
    ('www.superhuman.ai', 'daily_primary', 'Asia/Tokyo', 20, 30, ARRAY[1,2,3,4,5,6,0]::smallint[], 20, true),
    ('bensbites.co', 'daily_primary', 'Asia/Tokyo', 21, 0, ARRAY[1,2,3,4,5,6,0]::smallint[], 20, true),
    ('tldr.tech', 'daily_primary', 'Asia/Tokyo', 22, 30, ARRAY[1,2,3,4,5,6,0]::smallint[], 20, true)
), resolved AS (
  SELECT
    src.id AS source_id,
    sch.schedule_name,
    sch.timezone,
    sch.delivery_hour,
    sch.delivery_minute,
    sch.delivery_days,
    sch.fetch_delay_minutes,
    sch.is_active
  FROM seed_schedules sch
  JOIN public.sources src ON src.domain = sch.domain
)
INSERT INTO public.source_delivery_schedules (
  source_id,
  schedule_name,
  timezone,
  delivery_hour,
  delivery_minute,
  delivery_days,
  fetch_delay_minutes,
  is_active
)
SELECT
  source_id,
  schedule_name,
  timezone,
  delivery_hour,
  delivery_minute,
  delivery_days,
  fetch_delay_minutes,
  is_active
FROM resolved
ON CONFLICT (source_id, schedule_name)
DO UPDATE SET
  timezone = EXCLUDED.timezone,
  delivery_hour = EXCLUDED.delivery_hour,
  delivery_minute = EXCLUDED.delivery_minute,
  delivery_days = EXCLUDED.delivery_days,
  fetch_delay_minutes = EXCLUDED.fetch_delay_minutes,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Seed content workflows
-- ---------------------------------------------------------------------------
WITH seed_workflows(
  workflow_code,
  workflow_name,
  content_type,
  digest_edition,
  article_tag,
  objective,
  output_contract
) AS (
  VALUES
    ('digest-morning-curation', '朝刊キュレーション', 'digest', 'morning', null, '複数ニュースレターで検知したAI更新を一次情報で検証し、ソロビルダー向けに朝刊Digest化する。', 'Top10 + Top3深掘り + EN/JPリンク併記 + 今やること'),
    ('digest-evening-curation', '夕刊キュレーション', 'digest', 'evening', null, '当日昼以降の変化を統合し、朝刊との差分に特化した夕刊Digestを作成する。', 'Top10 + 差分強調 + EN/JPリンク併記 + 今夜やること'),
    ('news-dev-knowledge', '開発ナレッジ記事', 'news', null, 'dev-knowledge', '速報から実装手順を抽出し、ソロ開発者が当日実装できる記事にする。', '背景 + 実装手順 + 収益化メモ + EN/JPソース'),
    ('news-case-study', '事例分析記事', 'news', null, 'case-study', 'プロダクト/チームの成功失敗要因を再現可能な示唆に変換する。', '時系列 + KPI + 施策分解 + EN/JPソース'),
    ('product-dictionary-update', 'プロダクト辞書更新', 'product', null, null, '主要ツールの仕様変更を辞書ページへ反映し、ニュースからのリンク先を最新化する。', '差分更新 + 料金/機能 + 公式一次リンク')
)
INSERT INTO public.content_workflows (
  workflow_code,
  workflow_name,
  content_type,
  digest_edition,
  article_tag,
  objective,
  output_contract,
  is_active
)
SELECT
  workflow_code,
  workflow_name,
  content_type::public.content_type,
  digest_edition::public.digest_edition,
  article_tag,
  objective,
  output_contract,
  true
FROM seed_workflows
ON CONFLICT (workflow_code)
DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  content_type = EXCLUDED.content_type,
  digest_edition = EXCLUDED.digest_edition,
  article_tag = EXCLUDED.article_tag,
  objective = EXCLUDED.objective,
  output_contract = EXCLUDED.output_contract,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Seed workflow <-> source mappings
-- ---------------------------------------------------------------------------
WITH seed_mappings(workflow_code, source_domain, role, priority, is_required) AS (
  VALUES
    ('digest-morning-curation', 'www.therundown.ai', 'detect', 95, false),
    ('digest-morning-curation', 'www.superhuman.ai', 'detect', 85, false),
    ('digest-morning-curation', 'bensbites.co', 'detect', 80, false),
    ('digest-morning-curation', 'www.anthropic.com', 'verify', 100, true),
    ('digest-morning-curation', 'openai.com', 'verify', 100, true),
    ('digest-morning-curation', 'www.figma.com', 'verify', 95, false),
    ('digest-morning-curation', 'www.itmedia.co.jp', 'localize', 90, false),
    ('digest-morning-curation', 'www.publickey1.jp', 'localize', 85, false),

    ('digest-evening-curation', 'www.therundown.ai', 'detect', 95, false),
    ('digest-evening-curation', 'tldr.tech', 'detect', 80, false),
    ('digest-evening-curation', 'www.anthropic.com', 'verify', 100, true),
    ('digest-evening-curation', 'openai.com', 'verify', 100, true),
    ('digest-evening-curation', 'xtech.nikkei.com', 'localize', 88, false),
    ('digest-evening-curation', 'japan.cnet.com', 'localize', 82, false),

    ('news-dev-knowledge', 'www.anthropic.com', 'verify', 100, true),
    ('news-dev-knowledge', 'openai.com', 'verify', 100, true),
    ('news-dev-knowledge', 'www.figma.com', 'verify', 92, false),
    ('news-dev-knowledge', 'www.publickey1.jp', 'localize', 90, false),
    ('news-dev-knowledge', 'www.watch.impress.co.jp', 'localize', 82, false),

    ('news-case-study', 'www.therundown.ai', 'detect', 90, false),
    ('news-case-study', 'www.superhuman.ai', 'detect', 85, false),
    ('news-case-study', 'xtech.nikkei.com', 'localize', 88, false),
    ('news-case-study', 'www.itmedia.co.jp', 'localize', 85, false),

    ('product-dictionary-update', 'www.anthropic.com', 'verify', 100, true),
    ('product-dictionary-update', 'openai.com', 'verify', 100, true),
    ('product-dictionary-update', 'www.figma.com', 'verify', 95, true),
    ('product-dictionary-update', 'www.watch.impress.co.jp', 'benchmark', 78, false)
), resolved AS (
  SELECT
    wf.id AS workflow_id,
    src.id AS source_id,
    seed.role,
    seed.priority,
    seed.is_required
  FROM seed_mappings seed
  JOIN public.content_workflows wf ON wf.workflow_code = seed.workflow_code
  JOIN public.sources src ON src.domain = seed.source_domain
)
INSERT INTO public.workflow_source_mappings (
  workflow_id,
  source_id,
  role,
  priority,
  is_required
)
SELECT
  workflow_id,
  source_id,
  role,
  priority,
  is_required
FROM resolved
ON CONFLICT (workflow_id, source_id, role)
DO UPDATE SET
  priority = EXCLUDED.priority,
  is_required = EXCLUDED.is_required;

COMMIT;
