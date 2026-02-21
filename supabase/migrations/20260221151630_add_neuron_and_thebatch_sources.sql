BEGIN;

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
  notes,
  is_active
) AS (
  VALUES
    (
      'The Neuron',
      'https://www.theneurondaily.com/',
      'www.theneurondaily.com',
      'secondary',
      7,
      'editorial',
      'Daily AI newsletter for product and market signal detection.',
      'newsletter',
      'en',
      'global',
      true,
      false,
      NULL,
      'https://www.theneurondaily.com/',
      'Subscribed via ktlabworks+nl-neuron@gmail.com',
      true
    ),
    (
      'The Batch (DeepLearning.AI)',
      'https://www.deeplearning.ai/the-batch/',
      'www.deeplearning.ai',
      'secondary',
      8,
      'editorial',
      'DeepLearning.AI newsletter with high-signal research and industry updates.',
      'newsletter',
      'en',
      'global',
      true,
      false,
      NULL,
      'https://www.deeplearning.ai/the-batch/',
      'Subscribed via ktlabworks+nl-thebatch@gmail.com',
      true
    )
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
  is_active = seed.is_active
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
  notes,
  is_active
) AS (
  VALUES
    (
      'The Neuron',
      'https://www.theneurondaily.com/',
      'www.theneurondaily.com',
      'secondary',
      7,
      'editorial',
      'Daily AI newsletter for product and market signal detection.',
      'newsletter',
      'en',
      'global',
      true,
      false,
      NULL,
      'https://www.theneurondaily.com/',
      'Subscribed via ktlabworks+nl-neuron@gmail.com',
      true
    ),
    (
      'The Batch (DeepLearning.AI)',
      'https://www.deeplearning.ai/the-batch/',
      'www.deeplearning.ai',
      'secondary',
      8,
      'editorial',
      'DeepLearning.AI newsletter with high-signal research and industry updates.',
      'newsletter',
      'en',
      'global',
      true,
      false,
      NULL,
      'https://www.deeplearning.ai/the-batch/',
      'Subscribed via ktlabworks+nl-thebatch@gmail.com',
      true
    )
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
  seed.is_active
FROM seed_sources AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.sources existing
  WHERE existing.domain = seed.domain
);

WITH seed_schedules(domain, schedule_name, timezone, delivery_hour, delivery_minute, delivery_days, fetch_delay_minutes, is_active) AS (
  VALUES
    ('www.theneurondaily.com', 'daily_primary', 'Asia/Tokyo', 21, 20, ARRAY[0,1,2,3,4,5,6]::smallint[], 30, true),
    ('www.deeplearning.ai', 'weekly_primary', 'Asia/Tokyo', 22, 0, ARRAY[4]::smallint[], 60, false)
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

WITH seed_mappings(workflow_code, source_domain, role, priority, is_required) AS (
  VALUES
    ('digest-morning-curation', 'www.theneurondaily.com', 'detect', 78, false),
    ('digest-evening-curation', 'www.theneurondaily.com', 'detect', 72, false),
    ('digest-morning-curation', 'www.deeplearning.ai', 'benchmark', 68, false),
    ('news-dev-knowledge', 'www.deeplearning.ai', 'benchmark', 70, false)
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
