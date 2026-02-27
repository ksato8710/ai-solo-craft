-- Add 'json_feed' to crawl_method CHECK constraint
ALTER TABLE source_crawl_configs
  DROP CONSTRAINT source_crawl_configs_crawl_method_check;

ALTER TABLE source_crawl_configs
  ADD CONSTRAINT source_crawl_configs_crawl_method_check
  CHECK (crawl_method IN ('rss', 'api', 'scrape', 'newsletter', 'manual', 'json_feed'));

-- Update RSSHub Twitter sources to use json_feed with ?format=json
UPDATE source_crawl_configs
  SET crawl_method = 'json_feed',
      crawl_url = crawl_url || '&format=json'
  WHERE crawl_url LIKE '%127.0.0.1:1200/twitter/%'
    AND crawl_method = 'rss';
