# 📋 手動SQL実行手順

## 手順1: Supabaseダッシュボードにアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. AI Solo Craft プロジェクトを選択
3. 左側メニューから「SQL Editor」をクリック

## 手順2: 以下のSQLをコピー＆ペーストして実行

```sql
-- Step 1: 既存のcontent_sourcesテーブルを削除（安全確認後）
DROP TABLE IF EXISTS content_sources CASCADE;

-- Step 2: 新しいcontent_sourcesテーブルを作成
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5) DEFAULT 3,
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5) DEFAULT 3,
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: インデックスを作成
CREATE INDEX idx_content_sources_category ON content_sources(category);
CREATE INDEX idx_content_sources_active ON content_sources(is_active);
CREATE INDEX idx_content_sources_free ON content_sources(is_free);

-- Step 4: 更新時間自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_content_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Step 5: トリガーを作成
CREATE TRIGGER update_content_sources_updated_at_trigger
  BEFORE UPDATE ON content_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_content_sources_updated_at();

-- Step 6: Row Level Security (必要に応じて)
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;

-- パブリック読み取り許可ポリシー
CREATE POLICY "Allow public read access on content_sources" ON content_sources
  FOR SELECT USING (true);

-- 認証済みユーザーの書き込み許可ポリシー（管理用）
CREATE POLICY "Allow authenticated write access on content_sources" ON content_sources
  FOR ALL USING (true) WITH CHECK (true);

-- Step 7: 初期データ投入
INSERT INTO content_sources (name, url, category, quality_rating, accessibility_rating, is_free, is_active, description) VALUES
('Hacker News', 'https://news.ycombinator.com', 'tech-community', 4, 5, true, true, 'プログラマー・起業家コミュニティによる技術ニュースのランキングサイト'),
('GitHub Trending', 'https://github.com/trending', 'dev-tools', 4, 4, true, true, 'GitHubで注目されているオープンソースプロジェクトのトレンド'),
('Indie Hackers', 'https://www.indiehackers.com', 'indie-business', 4, 4, true, true, '独立開発者・ソロ起業家のコミュニティ'),
('Y Combinator News', 'https://www.ycombinator.com/blog', 'startup', 5, 4, true, true, 'YCによる起業家向けアドバイス・業界動向'),
('TechCrunch', 'https://techcrunch.com', 'startup', 4, 3, true, true, 'スタートアップ・投資・テック業界のニュースメディア'),
('Stack Overflow Blog', 'https://stackoverflow.blog', 'dev-knowledge', 4, 4, true, true, 'プログラマーQ&Aサイトによる開発動向・調査レポート'),
('Ars Technica', 'https://arstechnica.com', 'tech-analysis', 5, 3, true, true, '技術的に詳細で信頼性の高い解説記事'),
('Product Hunt', 'https://www.producthunt.com', 'startup', 3, 4, true, true, '新しいプロダクト・サービスの投稿・発見プラットフォーム');

-- Step 8: セットアップ確認
SELECT 
  'Setup completed!' as status,
  COUNT(*) as total_sources,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_sources
FROM content_sources;
```

## 手順3: SQLを実行

1. 上記のSQLを「New query」に貼り付け
2. 「RUN」ボタンをクリック
3. 成功メッセージを確認

## 手順4: 動作確認

SQLを実行したら、以下で動作確認：

```bash
npm run admin:check
```

または管理画面にアクセス：
- 開発: http://localhost:3000/admin/sources  
- 本番: https://ai.essential-navigator.com/admin/sources

## トラブルシューティング

### エラーが出た場合
1. 既存のデータがある場合は最初の`DROP TABLE`をコメントアウト
2. Step by Step で実行（一度に全部でなく、段階的に）
3. エラーメッセージを確認して、不足している権限がないかチェック

### 権限エラーの場合
Supabaseの設定で、必要な権限が付与されているかダッシュボードで確認してください。

---

このSQLを実行後、情報源管理画面がすぐに利用可能になります！ 🎉