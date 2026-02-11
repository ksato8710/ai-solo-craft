BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$ BEGIN
  CREATE TYPE public.content_type AS ENUM ('news', 'product', 'digest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft', 'review', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.digest_edition AS ENUM ('morning', 'evening');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.authoring_source AS ENUM ('markdown', 'db');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.product_relation_type AS ENUM ('primary', 'related', 'mentioned', 'ranking-item');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.source_type AS ENUM ('official', 'media', 'community', 'social', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.contents (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  content_type public.content_type NOT NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  date date NOT NULL,
  read_time integer NOT NULL CHECK (read_time > 0),
  hero_image_url text,
  body_markdown text NOT NULL,
  body_html text,
  legacy_category text,
  authoring_source public.authoring_source NOT NULL DEFAULT 'markdown',
  source_path text,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contents_type_status_date ON public.contents (content_type, status, date DESC);
CREATE INDEX IF NOT EXISTS idx_contents_status_published_at ON public.contents (status, published_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contents_set_updated_at ON public.contents;
CREATE TRIGGER trg_contents_set_updated_at
BEFORE UPDATE ON public.contents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.digest_details (
  content_id uuid PRIMARY KEY REFERENCES public.contents(id) ON DELETE CASCADE,
  edition public.digest_edition NOT NULL,
  digest_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (edition, digest_date)
);

DROP TRIGGER IF EXISTS trg_digest_details_set_updated_at ON public.digest_details;
CREATE TRIGGER trg_digest_details_set_updated_at
BEFORE UPDATE ON public.digest_details
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.products (
  content_id uuid PRIMARY KEY REFERENCES public.contents(id) ON DELETE CASCADE,
  product_slug text NOT NULL UNIQUE,
  website_url text,
  pricing_summary text,
  company_name text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_products_set_updated_at ON public.products;
CREATE TRIGGER trg_products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_tags_set_updated_at ON public.tags;
CREATE TRIGGER trg_tags_set_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.content_tags (
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.content_product_links (
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  product_content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  relation_type public.product_relation_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, product_content_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_content_product_links_content ON public.content_product_links (content_id);
CREATE INDEX IF NOT EXISTS idx_content_product_links_product ON public.content_product_links (product_content_id);

CREATE TABLE IF NOT EXISTS public.sources (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  source_type public.source_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_sources_set_updated_at ON public.sources;
CREATE TRIGGER trg_sources_set_updated_at
BEFORE UPDATE ON public.sources
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.content_sources (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  cited_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_content_sources_unique_ref
  ON public.content_sources (content_id, source_id, COALESCE(cited_url, ''));

CREATE TABLE IF NOT EXISTS public.digest_rankings (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  digest_content_id uuid NOT NULL UNIQUE REFERENCES public.contents(id) ON DELETE CASCADE,
  window_start timestamptz,
  window_end timestamptz,
  top_n integer NOT NULL DEFAULT 10 CHECK (top_n BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_digest_rankings_set_updated_at ON public.digest_rankings;
CREATE TRIGGER trg_digest_rankings_set_updated_at
BEFORE UPDATE ON public.digest_rankings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.digest_ranking_items (
  ranking_id uuid NOT NULL REFERENCES public.digest_rankings(id) ON DELETE CASCADE,
  rank integer NOT NULL CHECK (rank BETWEEN 1 AND 10),
  nva_total integer NOT NULL CHECK (nva_total BETWEEN 0 AND 100),
  headline text NOT NULL,
  news_content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  product_content_id uuid REFERENCES public.contents(id) ON DELETE SET NULL,
  source_url text,
  nva_social integer CHECK (nva_social IS NULL OR nva_social BETWEEN 0 AND 20),
  nva_media integer CHECK (nva_media IS NULL OR nva_media BETWEEN 0 AND 20),
  nva_community integer CHECK (nva_community IS NULL OR nva_community BETWEEN 0 AND 20),
  nva_technical integer CHECK (nva_technical IS NULL OR nva_technical BETWEEN 0 AND 20),
  nva_solo_relevance integer CHECK (nva_solo_relevance IS NULL OR nva_solo_relevance BETWEEN 0 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ranking_id, rank)
);

CREATE TABLE IF NOT EXISTS public.content_revisions (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  revision_no integer NOT NULL CHECK (revision_no > 0),
  frontmatter_json jsonb NOT NULL,
  body_markdown text NOT NULL,
  change_summary text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, revision_no)
);

CREATE OR REPLACE FUNCTION public.assert_content_type(
  target_content_id uuid,
  expected_type public.content_type,
  field_name text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  actual_type public.content_type;
BEGIN
  SELECT content_type INTO actual_type
  FROM public.contents
  WHERE id = target_content_id;

  IF actual_type IS NULL THEN
    RAISE EXCEPTION '% references missing content id: %', field_name, target_content_id;
  END IF;

  IF actual_type <> expected_type THEN
    RAISE EXCEPTION '% expects content_type %, got % (id=%)', field_name, expected_type, actual_type, target_content_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_digest_details_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_content_type(NEW.content_id, 'digest', 'digest_details.content_id');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_digest_details_validate ON public.digest_details;
CREATE TRIGGER trg_digest_details_validate
BEFORE INSERT OR UPDATE ON public.digest_details
FOR EACH ROW
EXECUTE FUNCTION public.trg_digest_details_validate();

CREATE OR REPLACE FUNCTION public.trg_products_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_content_type(NEW.content_id, 'product', 'products.content_id');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_validate ON public.products;
CREATE TRIGGER trg_products_validate
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trg_products_validate();

CREATE OR REPLACE FUNCTION public.trg_content_product_links_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_type public.content_type;
BEGIN
  SELECT content_type INTO source_type
  FROM public.contents
  WHERE id = NEW.content_id;

  IF source_type IS NULL THEN
    RAISE EXCEPTION 'content_product_links.content_id references missing content id: %', NEW.content_id;
  END IF;

  IF source_type NOT IN ('news', 'digest') THEN
    RAISE EXCEPTION 'content_product_links.content_id must be news or digest, got % (id=%)', source_type, NEW.content_id;
  END IF;

  PERFORM public.assert_content_type(NEW.product_content_id, 'product', 'content_product_links.product_content_id');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_content_product_links_validate ON public.content_product_links;
CREATE TRIGGER trg_content_product_links_validate
BEFORE INSERT OR UPDATE ON public.content_product_links
FOR EACH ROW
EXECUTE FUNCTION public.trg_content_product_links_validate();

CREATE OR REPLACE FUNCTION public.trg_digest_rankings_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_content_type(NEW.digest_content_id, 'digest', 'digest_rankings.digest_content_id');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_digest_rankings_validate ON public.digest_rankings;
CREATE TRIGGER trg_digest_rankings_validate
BEFORE INSERT OR UPDATE ON public.digest_rankings
FOR EACH ROW
EXECUTE FUNCTION public.trg_digest_rankings_validate();

COMMIT;
