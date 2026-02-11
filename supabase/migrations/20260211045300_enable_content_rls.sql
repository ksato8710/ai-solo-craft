BEGIN;

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_ranking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_published_contents ON public.contents;
CREATE POLICY public_read_published_contents
  ON public.contents
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS public_read_published_digest_details ON public.digest_details;
CREATE POLICY public_read_published_digest_details
  ON public.digest_details
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contents c
      WHERE c.id = digest_details.content_id
        AND c.status = 'published'
    )
  );

DROP POLICY IF EXISTS public_read_published_products ON public.products;
CREATE POLICY public_read_published_products
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contents c
      WHERE c.id = products.content_id
        AND c.status = 'published'
    )
  );

DROP POLICY IF EXISTS public_read_tags ON public.tags;
CREATE POLICY public_read_tags
  ON public.tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS public_read_content_tags ON public.content_tags;
CREATE POLICY public_read_content_tags
  ON public.content_tags
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contents c
      WHERE c.id = content_tags.content_id
        AND c.status = 'published'
    )
  );

DROP POLICY IF EXISTS public_read_content_product_links ON public.content_product_links;
CREATE POLICY public_read_content_product_links
  ON public.content_product_links
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contents c
      WHERE c.id = content_product_links.content_id
        AND c.status = 'published'
    )
    AND EXISTS (
      SELECT 1
      FROM public.contents p
      WHERE p.id = content_product_links.product_content_id
        AND p.status = 'published'
    )
  );

DROP POLICY IF EXISTS public_read_sources ON public.sources;
CREATE POLICY public_read_sources
  ON public.sources
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS public_read_content_sources ON public.content_sources;
CREATE POLICY public_read_content_sources
  ON public.content_sources
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contents c
      WHERE c.id = content_sources.content_id
        AND c.status = 'published'
    )
  );

DROP POLICY IF EXISTS public_read_digest_rankings ON public.digest_rankings;
CREATE POLICY public_read_digest_rankings
  ON public.digest_rankings
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contents c
      WHERE c.id = digest_rankings.digest_content_id
        AND c.status = 'published'
    )
  );

DROP POLICY IF EXISTS public_read_digest_ranking_items ON public.digest_ranking_items;
CREATE POLICY public_read_digest_ranking_items
  ON public.digest_ranking_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.digest_rankings r
      JOIN public.contents c ON c.id = r.digest_content_id
      WHERE r.id = digest_ranking_items.ranking_id
        AND c.status = 'published'
    )
  );

COMMIT;
