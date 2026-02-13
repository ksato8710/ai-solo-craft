-- Create news_sources table for information source classification
-- Supports primary/secondary/tertiary categorization for AI Solo Builder

CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('primary', 'secondary', 'tertiary')),
  credibility_score INTEGER NOT NULL CHECK (credibility_score >= 1 AND credibility_score <= 10),
  verification_level TEXT NOT NULL CHECK (verification_level IN ('official', 'editorial', 'community')),
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS news_sources_domain_idx ON public.news_sources(domain);
CREATE INDEX IF NOT EXISTS news_sources_source_type_idx ON public.news_sources(source_type);
CREATE INDEX IF NOT EXISTS news_sources_credibility_idx ON public.news_sources(credibility_score);

-- Enable RLS (Row Level Security)
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY IF NOT EXISTS "Allow public read access to news_sources" 
ON public.news_sources FOR SELECT 
TO public 
USING (true);

-- Insert initial source data with proper classification
INSERT INTO public.news_sources (name, url, domain, source_type, credibility_score, verification_level, description, category) VALUES
-- PRIMARY SOURCES (Official sources from companies/organizations)
('OpenAI Blog', 'https://openai.com/blog', 'openai.com', 'primary', 9, 'official', 'OpenAI公式ブログ - GPT, ChatGPT, DALL-Eなどの最新発表', 'ai-official'),
('Anthropic News', 'https://www.anthropic.com/news', 'anthropic.com', 'primary', 9, 'official', 'Anthropic公式ニュース - Claude関連の公式発表', 'ai-official'),
('Meta AI Blog', 'https://ai.meta.com/blog', 'ai.meta.com', 'primary', 8, 'official', 'Meta AI公式ブログ - LLaMA等の研究発表', 'ai-official'),
('Google AI Blog', 'https://ai.googleblog.com', 'ai.googleblog.com', 'primary', 8, 'official', 'Google AI公式ブログ - Gemini等の技術発表', 'ai-official'),
('GitHub Release', 'https://github.com', 'github.com', 'primary', 8, 'official', 'GitHub公式リリース・アナウンス', 'dev-tools'),
('AWS News Blog', 'https://aws.amazon.com/blogs/aws', 'aws.amazon.com', 'primary', 8, 'official', 'AWS公式ブログ', 'cloud-services'),

-- SECONDARY SOURCES (Editorial/Organizational media)
('TechCrunch', 'https://techcrunch.com', 'techcrunch.com', 'secondary', 7, 'editorial', '技術系メディアの老舗、編集部による分析記事', 'tech-media'),
('The Verge', 'https://www.theverge.com', 'theverge.com', 'secondary', 7, 'editorial', 'テクノロジー専門メディア', 'tech-media'),
('Ars Technica', 'https://arstechnica.com', 'arstechnica.com', 'secondary', 8, 'editorial', '技術に特化した高品質な分析メディア', 'tech-media'),
('Wired', 'https://www.wired.com', 'wired.com', 'secondary', 7, 'editorial', 'テクノロジーと文化のメディア', 'tech-media'),
('InfoQ', 'https://www.infoq.com', 'infoq.com', 'secondary', 8, 'editorial', 'ソフトウェア開発者向け専門メディア', 'dev-media'),
('SD Times', 'https://sdtimes.com', 'sdtimes.com', 'secondary', 7, 'editorial', 'ソフトウェア開発ニュース', 'dev-media'),

-- TERTIARY SOURCES (Community/Individual content)
('Hacker News', 'https://news.ycombinator.com', 'news.ycombinator.com', 'tertiary', 6, 'community', 'プログラマー・起業家コミュニティによるニュースランキング', 'tech-community'),
('Reddit r/MachineLearning', 'https://reddit.com/r/MachineLearning', 'reddit.com', 'tertiary', 5, 'community', 'Reddit機械学習コミュニティ', 'ai-community'),
('X (Twitter)', 'https://twitter.com', 'twitter.com', 'tertiary', 4, 'community', 'X/Twitter投稿（個人発信含む）', 'social-media'),
('Medium', 'https://medium.com', 'medium.com', 'tertiary', 5, 'community', '個人ブログ・体験談記事', 'blog-platform'),
('Dev.to', 'https://dev.to', 'dev.to', 'tertiary', 6, 'community', '開発者コミュニティ記事', 'dev-community');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_sources_updated_at 
  BEFORE UPDATE ON public.news_sources 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.news_sources IS 'Information sources classification for AI Solo Builder - supports primary/secondary/tertiary categorization';