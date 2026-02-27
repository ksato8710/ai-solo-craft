# AI Solo Craft

AIソロビルダー向け日本語ニュースキュレーションサイト。
124ソースから自動収集 → NVA 5軸スコアリング → 朝刊Digest配信。

**本番:** https://ai-solo-craft.craftgarden.studio

## 技術スタック

- **フロントエンド:** Next.js (App Router) + Tailwind CSS + TypeScript
- **データベース:** Supabase (PostgreSQL)
- **ホスティング:** Vercel
- **自動化:** Vercel Cron + スキルシステム

## Getting Started

```bash
npm install
npm run dev
```

環境変数（`.env.local`）:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

## ニュース収集パイプライン

124ソースを3階層（一次/二次/三次）に分類し、自動収集・スコアリングを行う。

```
Vercel Cron (06:00)
  → collect-sources API
  → RSS / API / Scrape で収集
  → NVA 5軸ルールベーススコアリング (0-100)
  → collected_items テーブルに保存
```

**NVA 5軸:** social, media, community, technical, solo_relevance（各0-20 → 加重平均×5 → 0-100）

主要ファイル:
- `src/lib/crawler.ts` — クローラー
- `src/lib/scorer.ts` — スコアラー
- `src/app/api/cron/collect-sources/route.ts` — Cron エントリポイント

## 管理画面

| ページ | URL | 内容 |
|--------|-----|------|
| ダッシュボード | `/admin` | ツール導線 + システムリファレンス |
| 収集データ管理 | `/admin/collected-items` | 収集ニュースの一覧・フィルタ・手動編集 |
| スコアリング | `/admin/scoring` | NVA統計・分布・重み設定 |
| Source Intelligence | `/admin/source-intelligence` | 3階層ソース分析 |
| ワークフロー | `/admin/workflows` | 記事種別×ソースの役割 |

## Supabase (Database)

詳細: `docs/technical/DATABASE.md`

```bash
npm run db:push              # マイグレーション適用
npm run db:migrations:list   # ステータス確認
npm run db:types             # 型生成
npm run sync:content:db      # Markdownコンテンツ同期
npm run publish:gate         # 公開前チェック（必須）
```

主要テーブル:
- `contents` — 公開コンテンツ
- `sources` — 124ソース定義
- `source_crawl_configs` — ソースごとのクロール設定
- `collected_items` — 収集データ + NVAスコア
- `scoring_config` — スコアリング重み設定

## API

```
GET  /api/v1/contents           # コンテンツ一覧
GET  /api/v1/contents/[slug]    # コンテンツ詳細
POST /api/cron/collect-sources  # 自動収集（Cron）
POST /api/cron/send-newsletter  # ニュースレター配信（Cron）
GET  /api/admin/collected-items # 収集データ管理
GET  /api/admin/scoring-config  # スコアリング設定
```

## Cron スケジュール (vercel.json)

| 時刻 | パス | 内容 |
|------|------|------|
| 06:00 | `/api/cron/collect-sources` | 自動収集 + NVAスコアリング |
| 23:15 | `/api/cron/send-newsletter` | ニュースレター配信 |

## コンテンツ検証

```bash
npm run validate:content     # コンテンツ検証
npm run publish:gate         # 公開ゲート（DB検証 + ビルド）
```

## Deploy

```bash
git push origin main         # Vercel自動デプロイ
```
