BEGIN;

-- 既存sourcesテーブルにドメイン情報を追加・更新
-- まず既存データのdomainフィールドを更新（urlからドメインを抽出）
UPDATE public.sources 
SET domain = 
  CASE 
    WHEN url ~ '^https?://([^/]+)' THEN 
      regexp_replace(url, '^https?://([^/]+).*', '\1')
    ELSE url
  END
WHERE domain IS NULL;

-- 重要なソースの信頼性情報を設定

-- Primary Sources (公式・一次情報)
INSERT INTO public.sources (id, name, url, domain, source_type, credibility_score, verification_level, description)
VALUES 
  (gen_random_uuid(), 'OpenAI Blog', 'https://openai.com/blog', 'openai.com', 'primary', 10, 'official', 'Official blog of OpenAI with product announcements and research updates'),
  (gen_random_uuid(), 'Google AI Blog', 'https://blog.google/technology/ai', 'blog.google', 'primary', 10, 'official', 'Google official AI and technology announcements'),
  (gen_random_uuid(), 'GitHub Releases', 'https://github.com/releases', 'github.com', 'primary', 9, 'official', 'Official software releases and changelogs'),
  (gen_random_uuid(), 'Apple Developer', 'https://developer.apple.com/news', 'developer.apple.com', 'primary', 9, 'official', 'Official Apple developer documentation and announcements'),
  (gen_random_uuid(), 'Meta Research', 'https://research.facebook.com', 'research.facebook.com', 'primary', 9, 'official', 'Meta (Facebook) official research publications'),
  (gen_random_uuid(), 'Microsoft Research', 'https://www.microsoft.com/en-us/research/blog', 'www.microsoft.com', 'primary', 9, 'official', 'Microsoft official research blog'),
  (gen_random_uuid(), 'AWS News', 'https://aws.amazon.com/new', 'aws.amazon.com', 'primary', 9, 'official', 'Amazon Web Services official announcements'),
  (gen_random_uuid(), 'Anthropic Blog', 'https://www.anthropic.com/news', 'www.anthropic.com', 'primary', 9, 'official', 'Anthropic official AI safety and research updates');

-- Secondary Sources (専門メディア・編集)
INSERT INTO public.sources (id, name, url, domain, source_type, credibility_score, verification_level, description)
VALUES 
  (gen_random_uuid(), 'TechCrunch', 'https://techcrunch.com', 'techcrunch.com', 'secondary', 8, 'editorial', 'Leading technology news with professional editorial team'),
  (gen_random_uuid(), 'The Verge', 'https://www.theverge.com', 'www.theverge.com', 'secondary', 8, 'editorial', 'Technology, science, art, and culture coverage'),
  (gen_random_uuid(), 'Ars Technica', 'https://arstechnica.com', 'arstechnica.com', 'secondary', 8, 'editorial', 'In-depth technology analysis and reporting'),
  (gen_random_uuid(), 'InfoQ', 'https://www.infoq.com', 'www.infoq.com', 'secondary', 7, 'editorial', 'Software development news and expert content'),
  (gen_random_uuid(), 'IEEE Spectrum', 'https://spectrum.ieee.org', 'spectrum.ieee.org', 'secondary', 8, 'editorial', 'IEEE official technology and engineering magazine'),
  (gen_random_uuid(), 'MIT Technology Review', 'https://www.technologyreview.com', 'www.technologyreview.com', 'secondary', 8, 'editorial', 'MIT official technology magazine'),
  (gen_random_uuid(), 'Wired', 'https://www.wired.com', 'www.wired.com', 'secondary', 7, 'editorial', 'Technology, business, and culture magazine'),
  (gen_random_uuid(), 'VentureBeat', 'https://venturebeat.com', 'venturebeat.com', 'secondary', 7, 'editorial', 'Technology news and startup coverage');

-- Tertiary Sources (コミュニティ・個人)
INSERT INTO public.sources (id, name, url, domain, source_type, credibility_score, verification_level, description)
VALUES 
  (gen_random_uuid(), 'Hacker News', 'https://news.ycombinator.com', 'news.ycombinator.com', 'tertiary', 6, 'community', 'Technology community discussion and link sharing'),
  (gen_random_uuid(), 'Reddit Programming', 'https://www.reddit.com/r/programming', 'www.reddit.com', 'tertiary', 5, 'community', 'Programming community discussions on Reddit'),
  (gen_random_uuid(), 'Dev.to', 'https://dev.to', 'dev.to', 'tertiary', 5, 'community', 'Developer community platform for sharing knowledge'),
  (gen_random_uuid(), 'Medium', 'https://medium.com', 'medium.com', 'tertiary', 4, 'community', 'Individual author articles and opinions'),
  (gen_random_uuid(), 'Twitter/X Tech', 'https://twitter.com', 'twitter.com', 'tertiary', 3, 'community', 'Social media technology discussions'),
  (gen_random_uuid(), 'ProductHunt', 'https://www.producthunt.com', 'www.producthunt.com', 'tertiary', 5, 'community', 'Product discovery and community voting platform');

-- 日本語ソースも追加
INSERT INTO public.sources (id, name, url, domain, source_type, credibility_score, verification_level, description)
VALUES 
  (gen_random_uuid(), 'ITmedia', 'https://www.itmedia.co.jp', 'www.itmedia.co.jp', 'secondary', 7, 'editorial', 'Japanese technology news and enterprise IT coverage'),
  (gen_random_uuid(), 'Impress Watch', 'https://www.watch.impress.co.jp', 'www.watch.impress.co.jp', 'secondary', 6, 'editorial', 'Japanese technology news and product reviews'),
  (gen_random_uuid(), 'Qiita', 'https://qiita.com', 'qiita.com', 'tertiary', 5, 'community', 'Japanese developer knowledge sharing platform'),
  (gen_random_uuid(), 'Zenn', 'https://zenn.dev', 'zenn.dev', 'tertiary', 5, 'community', 'Japanese developer technical articles platform');

COMMIT;