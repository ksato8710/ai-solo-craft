-- Add body columns to source_delivery_observations
ALTER TABLE public.source_delivery_observations
ADD COLUMN IF NOT EXISTS body_text TEXT,
ADD COLUMN IF NOT EXISTS body_html TEXT;

COMMENT ON COLUMN public.source_delivery_observations.body_text IS 'Plain text body of the newsletter';
COMMENT ON COLUMN public.source_delivery_observations.body_html IS 'HTML body of the newsletter';
