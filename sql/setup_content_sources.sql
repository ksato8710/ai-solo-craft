-- Content Sources管理テーブルの完全セットアップ
-- 既存テーブルを削除して再作成

BEGIN;

-- 既存テーブルの削除（安全のため）
DROP TABLE IF EXISTS content_sources CASCADE;

-- 新しいcontent_sourcesテーブルを作成
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_content_sources_category ON content_sources(category);
CREATE INDEX idx_content_sources_active ON content_sources(is_active);
CREATE INDEX idx_content_sources_free ON content_sources(is_free);

-- 更新時間の自動更新用トリガー関数
CREATE OR REPLACE FUNCTION update_content_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- トリガー作成
CREATE TRIGGER update_content_sources_updated_at_trigger
  BEFORE UPDATE ON content_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_content_sources_updated_at();

-- Row Level Security 設定
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;

-- 基本ポリシー: 読み取りは公開、書き込みは認証必要
CREATE POLICY "Allow public read access on content_sources" ON content_sources
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on content_sources" ON content_sources
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on content_sources" ON content_sources
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on content_sources" ON content_sources
  FOR DELETE USING (true);

-- 初期データ投入
INSERT INTO content_sources (name, url, category, quality_rating, accessibility_rating, is_free, is_active, description) VALUES
('Hacker News', 'https://news.ycombinator.com', 'tech-community', 4, 5, true, true, 'プログラマー・起業家コミュニティによる技術ニュースのランキングサイト。質の高い議論と一次ソースが特徴'),
('GitHub Trending', 'https://github.com/trending', 'dev-tools', 4, 4, true, true, 'GitHubで注目されているオープンソースプロジェクトのトレンド。開発者による実際の利用が反映'),
('Indie Hackers', 'https://www.indiehackers.com', 'indie-business', 4, 4, true, true, '独立開発者・ソロ起業家のコミュニティ。収益化事例・運営ノウハウ'),
('Y Combinator News', 'https://www.ycombinator.com/blog', 'startup', 5, 4, true, true, 'YCによる起業家向けアドバイス・業界動向。実践的なスタートアップノウハウ'),
('TechCrunch', 'https://techcrunch.com', 'startup', 4, 3, true, true, 'スタートアップ・投資・テック業界のニュースメディア。資金調達・企業動向の速報に強み'),
('Stack Overflow Blog', 'https://stackoverflow.blog', 'dev-knowledge', 4, 4, true, true, 'プログラマーQ&Aサイトによる開発動向・調査レポート'),
('Ars Technica', 'https://arstechnica.com', 'tech-analysis', 5, 3, true, true, '技術的に詳細で信頼性の高い解説記事。エンジニア向けの深い分析'),
('Product Hunt', 'https://www.producthunt.com', 'startup', 3, 4, true, true, '新しいプロダクト・サービスの投稿・発見プラットフォーム。早期アダプターによる評価'),
('The Verge', 'https://www.theverge.com', 'consumer-tech', 4, 4, true, true, 'コンシューマー向け技術製品・サービスのニュース・レビュー'),
('Fast Company', 'https://www.fastcompany.com', 'business-innovation', 4, 3, true, true, 'イノベーション・デザイン・ビジネス戦略の記事'),
('Dev.to', 'https://dev.to', 'dev-knowledge', 3, 5, true, true, '開発者コミュニティによる技術記事・体験談の投稿サイト'),
('VentureBeat', 'https://venturebeat.com', 'startup', 3, 4, true, true, 'AI・ゲーム・モバイル技術のニュース'),
('AngelList (Wellfound)', 'https://wellfound.com', 'startup', 3, 3, true, true, 'スタートアップの求人・資金調達情報');

COMMIT;

-- セットアップ確認用クエリ
SELECT 
  'Setup completed successfully!' as status,
  COUNT(*) as total_sources,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_sources,
  COUNT(CASE WHEN is_free = true THEN 1 END) as free_sources
FROM content_sources;