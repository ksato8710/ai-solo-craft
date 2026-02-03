# Site Config — サイト設定スキル

## 概要
AI Solo Builder の技術仕様・デプロイ手順・運用ルール。

## 基本情報

| 項目 | 値 |
|------|-----|
| URL | https://ai.essential-navigator.com |
| Vercel URL | https://ai-solo-builder.vercel.app |
| GitHub | ksato8710/ai-solo-builder |
| スタック | Next.js (App Router) + Tailwind CSS + TypeScript + SSG |
| ローカル | /Users/satokeita/ai-solo-builder |

## コンテンツ管理

### 記事ファイル
- パス: `content/news/YYYY-MM-DD-slug.md`
- フォーマット: Markdown + YAML frontmatter
- 読み取り: `src/lib/posts.ts`（gray-matter + marked）

### NVA評価データ
- パス: `research/YYYY-MM-DD-slug/`
- 読み取り: `src/lib/research.ts`
- マッピング: `PRODUCT_NAMES`（日本語タイトル）, `ARTICLE_SLUG_MAP`（記事リンク）
- **新記事追加時にマッピング更新が必要**

### ツールディレクトリ
- データ: `src/data/tools.ts`（ハードコード、67件）

## デプロイ手順

```bash
# 1. 記事追加
git add content/news/YYYY-MM-DD-slug.md
git add research/YYYY-MM-DD-slug/  # NVA対象の場合

# 2. NVAマッピング更新（対象記事の場合）
# src/lib/research.ts の PRODUCT_NAMES と ARTICLE_SLUG_MAP を編集

# 3. コミット & プッシュ
git commit -m "記事タイトル"
git push

# 4. デプロイ確認（1-2分待つ）
# https://ai.essential-navigator.com/news/[slug] にアクセス
```

## カテゴリ設定

| slug | 名称 | カラー |
|------|------|--------|
| morning-news | 🌅 朝のAIニュース | #3B82F6 |
| featured-tools | 🛠️ 注目ツール | #8B5CF6 |
| deep-dive | 🔬 深掘り・ハウツー | #10b981 |
| case-study | 📊 事例分析 | #f59e0b |

## 注意事項
- URL共有前に必ずブラウザで表示確認（TOOLS.md参照）
- ビルドエラー時は `npm run build` でローカル確認
- 画像がない記事はカテゴリ別デフォルト画像を使用

## 参照ドキュメント
- CLAUDE.md — プロジェクト全体の技術仕様
- docs/SITE-ARCHITECTURE.md — サイト構成詳細
