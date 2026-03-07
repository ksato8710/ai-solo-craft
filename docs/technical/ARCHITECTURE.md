# AI Solo Craft — サイト構成

*作成日: 2026-02-03*
*更新日: 2026-02-11（DBエンティティ設計追記）*

> 最新のデータモデル正本は `specs/content-policy/spec.md` と `specs/content-model-db/spec.md` を参照。
> このドキュメントの旧 `category` 記述は、現行実装互換の説明を含みます。

---

## 技術スタック

| 要素 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| ビルド | SSG（Static Site Generation） |
| ホスティング | Vercel（無料枠） |
| コンテンツ | Markdown（authoring） + PostgreSQL（serving/query） |
| デプロイ | git push → Vercel自動デプロイ |
| リポジトリ | （このリポジトリ） |
| ドメイン | ai.essential-navigator.com |
| 外部配信API | Next.js Route Handler (`/api/v1/*`) |

---

## ディレクトリ構成

```
ai-solo-craft/
├── src/
│   ├── app/
│   │   ├── page.tsx          # トップページ
│   │   ├── layout.tsx        # ルートレイアウト
│   │   ├── news/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # 記事詳細ページ
│   │   ├── products/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # プロダクト詳細ページ
│   │   ├── category/
│   │   │   └── [category]/
│   │   │       └── page.tsx  # カテゴリ一覧ページ
│   │   └── news-value/
│   │       └── page.tsx      # NVAランキング（最新Digest）
│   ├── lib/
│   │   ├── posts.ts          # Markdown読み取り・パース
│   │   ├── digest.ts         # Digest内ランキング表の読み取り
│   │   ├── newsletter.ts     # ニュースレター共有ライブラリ
│   │   └── research.ts       # NVA中間資料（将来拡張/分析用）
│   ├── emails/               # React Email テンプレート
│   │   ├── verification.tsx
│   │   ├── morning-digest.tsx
│   │   └── components/       # 共有メールコンポーネント
│   ├── data/
│   │   └── tools.ts          # ツールディレクトリデータ（67件）
├── content/
│   ├── news/                 # 記事Markdownファイル（Digest/ニュース/ナレッジ/事例）
│   └── products/             # プロダクト記事（辞書）
├── research/                 # NVA中間資料
│   └── YYYY-MM-DD-slug/
│       ├── assessment.md     # NVA評価結果
│       └── sources.md        # ソースデータ
├── docs/
│   ├── business/             # 事業設計（CONCEPT, LEAN-CANVAS, BRAND-IDENTITY）
│   ├── operations/           # 運用（ワークフロー, チェックリスト, 編集ガイドライン）
│   ├── technical/            # 技術（サイト構成, API, DB）
│   └── archive/              # アーカイブ（設計アーティファクト）
├── specs/                    # 正規仕様（content-policy, content-model-db）
├── public/
│   └── images/               # 静的画像
├── CLAUDE.md                 # プロジェクト設定
└── README.md
```

---

## ページ構成

| パス | ページ | 内容 |
|------|--------|------|
| `/` | トップページ | ヒーロー + カテゴリ別グリッド |
| `/news/[slug]` | 記事詳細 | 記事本文 + NVA評価 |
| `/products/[slug]` | プロダクト詳細 | プロダクトの恒久ページ（前提情報） |
| `/category/[category]` | カテゴリ一覧 | カテゴリ別記事リスト |
| `/news-value` | NVAランキング | 朝刊Digestごとに更新されるTop 10ランキング |
| `/newsletter/confirmed` | 登録確認 | ニュースレター登録確認ページ |
| `/newsletter/unsubscribed` | 配信停止 | 配信停止ページ（フィードバック付き） |

## API構成（Web / Flutter共通）

| パス | 用途 |
|------|------|
| `/api/v1/feed` | モバイル向けホーム集約レスポンス |
| `/api/v1/contents` | フィルタ付き一覧取得 |
| `/api/v1/contents/[slug]` | 詳細取得 |

## API構成（ニュースレター）

| パス | メソッド | 用途 |
|------|---------|------|
| `/api/newsletter/subscribe` | POST | メール登録 |
| `/api/newsletter/confirm` | GET | 登録確認（リダイレクト） |
| `/api/newsletter/unsubscribe` | GET | 配信停止（リダイレクト） |
| `/api/cron/send-newsletter` | POST | 日次配信（Vercel Cron） |

詳細: `docs/technical/NEWSLETTER.md`

---

## コンテンツ（Markdown）仕様

### Frontmatter（canonical V2）

> 正規定義: `specs/content-policy/spec.md`

```yaml
---
title: "記事タイトル"
slug: "url-friendly-slug"
date: "YYYY-MM-DD"
contentType: "digest"            # news | product | digest
digestEdition: "morning"         # morning（digest時のみ）
tags: ["dev-knowledge"]          # news時の分類タグ
relatedProducts: ["product-slug"] # 関連プロダクト（/products/[slug]）
description: "記事の要約（120文字以内）"
readTime: 5
featured: false
image: "/images/xxx.jpg"
---
```

### コンテンツ種別とカラー

| contentType | 条件 | 名称 | カラー |
|-------------|------|------|--------|
| digest | digestEdition: morning | 🗞️ 朝刊Digest | #3B82F6 |
| news | — | 📰 ニュース（個別） | #6366F1 |
| news | tags: [dev-knowledge] | 🧠 AI開発ナレッジ | #10b981 |
| news | tags: [case-study] | 📊 個人開発者事例紹介 | #f59e0b |
| product | — | 🏷️ プロダクト（辞書） | #8B5CF6 |

レガシーカテゴリからの移行マップは `docs/operations/CONTENT-STRATEGY.md` を参照。

---

## デプロイ手順

```bash
# 記事追加
1. content/news/ または content/products/ に Markdown を作成
2. git add -A && git commit -m "記事タイトル" && git push
3. Vercelが自動デプロイ（1〜2分）
4. https://ai.essential-navigator.com/news/[slug] または /products/[slug] で公開確認
```

### NVA評価データの更新

```bash
# /news-value への反映
1. Digest記事（contentType: digest）に「重要ニュースランキング（NVA）」の表を作成/更新
2. Top 3を深掘りし、必要なら個別ニュース記事も作成してリンク
3. 研究メモとして research/YYYY-MM-DD-slug/ にassessment.md + sources.md を保存（任意だが推奨）
4. git push でデプロイ
```

---

## 外部連携

| サービス | 用途 | 状態 |
|---------|------|------|
| Vercel | ホスティング・デプロイ | ✅ 稼働中 |
| GitHub | ソースコード管理 | ✅ 稼働中 |
| Google Analytics (GA4) | アクセス解析 | ⬜ 未設定 |
| Search Console | 検索パフォーマンス | ⬜ 未設定 |
| Route 53 | DNS（CNAME → Vercel） | ✅ 設定済み |
| Resend | メール配信（ニュースレター） | ✅ APIキー設定済み / ⬜ ドメイン認証未設定 |

---

*更新日: 2026-02-19（ニュースレター機能追加）*
*このサイト構成はCLAUDE.mdの技術仕様と整合。変更時は両方を更新すること。*
