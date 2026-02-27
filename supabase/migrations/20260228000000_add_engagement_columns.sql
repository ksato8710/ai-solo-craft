ALTER TABLE collected_items
  ADD COLUMN engagement_likes     integer,
  ADD COLUMN engagement_retweets  integer,
  ADD COLUMN engagement_replies   integer,
  ADD COLUMN engagement_quotes    integer,
  ADD COLUMN engagement_bookmarks integer,
  ADD COLUMN engagement_views     integer,
  ADD COLUMN engagement_fetched_at timestamptz;

COMMENT ON COLUMN collected_items.engagement_likes IS 'X(Twitter) like count at crawl time';
COMMENT ON COLUMN collected_items.engagement_retweets IS 'X(Twitter) retweet count at crawl time';
COMMENT ON COLUMN collected_items.engagement_replies IS 'X(Twitter) reply count at crawl time';
COMMENT ON COLUMN collected_items.engagement_quotes IS 'X(Twitter) quote count at crawl time';
COMMENT ON COLUMN collected_items.engagement_bookmarks IS 'X(Twitter) bookmark count at crawl time';
COMMENT ON COLUMN collected_items.engagement_views IS 'X(Twitter) view count at crawl time';
COMMENT ON COLUMN collected_items.engagement_fetched_at IS 'Timestamp when engagement data was fetched';
