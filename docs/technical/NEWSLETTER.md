# ニュースレター機能 技術仕様

*作成日: 2026-02-19*

> リーンキャンバス Phase 2 の「メールニュースレター」機能。毎朝の Digest をメールで届けるシンプルなサービスとしてスタートし、将来の有料化への布石とする。

---

## 1. アーキテクチャ概要

```
┌──────────────────────────────────────────────────────┐
│                     ユーザー                          │
│                                                      │
│  ① 登録フォーム   ② 確認メール   ③ 朝刊メール        │
│     (Web UI)        (Resend)       (Resend)          │
└──────┬──────────────┬──────────────┬─────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────────────────────────────────────────────────┐
│                  Next.js API Routes                   │
│                                                      │
│  POST /api/newsletter/subscribe   ← 登録             │
│  GET  /api/newsletter/confirm     ← 確認             │
│  GET  /api/newsletter/unsubscribe ← 配信停止          │
│  POST /api/cron/send-newsletter   ← 日次配信          │
└──────┬──────────────┬──────────────┬─────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   Supabase   │ │  Resend  │ │ Vercel Cron  │
│ (PostgreSQL) │ │ (Email)  │ │  (23:15 UTC) │
└──────────────┘ └──────────┘ └──────────────┘
```

---

## 2. 技術選定

| 要素 | 技術 | 理由 |
|------|------|------|
| メール配信 | **Resend** | React Email ネイティブ対応、Next.js 親和性、無料枠 3,000通/月 |
| テンプレート | **React Email** | JSX でメール HTML 生成、プロジェクトの TSX パターンと統一 |
| スケジューラ | **Vercel Cron Jobs** | `vercel.json` に1行追加で完結、Hobby プラン対応 |
| データ保存 | **Supabase** | 既存インフラ流用、RLS でセキュリティ担保 |
| Opt-in | **シングルオプトイン + 確認メール** | 登録 → pending → 確認リンク → active |

---

## 3. データモデル

### 3.1 newsletter_subscribers

マイグレーション: `supabase/migrations/20260219000000_add_newsletter.sql`

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | uuid PK | `gen_random_uuid()` |
| `email` | text UNIQUE | CHECK 制約でフォーマット検証 |
| `status` | `subscriber_status` enum | `pending_verification` / `active` / `unsubscribed` / `bounced` / `complained` |
| `verify_token` | uuid UNIQUE | 確認用トークン（自動生成） |
| `verified_at` | timestamptz | 確認完了日時 |
| `unsubscribe_token` | uuid UNIQUE | 配信停止用トークン（全メールに埋め込み） |
| `unsubscribed_at` | timestamptz | 配信停止日時 |
| `unsubscribe_reason` | text | フィードバック理由 |
| `ip_address` | text | 登録時 IP（レート制限用） |
| `user_agent` | text | 登録時 UA |
| `tier` | text DEFAULT `'free'` | 将来の有料化対応 |
| `preferences` | jsonb DEFAULT `'{}'` | 将来の配信設定対応 |
| `created_at` / `updated_at` | timestamptz | `set_updated_at()` トリガー利用 |

### 3.2 newsletter_send_logs

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | uuid PK | |
| `digest_content_id` | uuid FK → `contents` | 配信した Digest |
| `subject` | text | メール件名 |
| `send_date` | date | 配信日 |
| `total_recipients` | integer | 対象者数 |
| `successful_sends` | integer | 成功数 |
| `failed_sends` | integer | 失敗数 |
| `errors` | jsonb | エラー詳細 |
| `started_at` / `completed_at` | timestamptz | 配信時間 |

### 3.3 RLS

両テーブルとも RLS 有効。ポリシーなし = `anon` / `authenticated` アクセス不可。`service_role` のみ操作可能。

### 3.4 ステータス遷移

```
[新規登録] → pending_verification → [確認クリック] → active → [配信停止] → unsubscribed
                                                      ↓
                                                  bounced / complained（Resend Webhook で将来対応）
```

---

## 4. API エンドポイント

### 4.1 `POST /api/newsletter/subscribe`

登録処理。

| 項目 | 内容 |
|------|------|
| リクエスト | `{ email: string, _hp?: string }` |
| レスポンス | `{ ok: boolean, message: string }` |
| セキュリティ | ハニーポット (`_hp`)、レート制限（同一 IP から 1h に 5回）、メール形式検証 |
| 副作用 | DB upsert + Resend 確認メール送信 |

**処理フロー:**
1. ハニーポットチェック（`_hp` が空でなければボット）
2. メール形式バリデーション
3. IP ベースレート制限チェック
4. DB 既存チェック → 新規 insert / 既存更新（再送対応）
5. 確認メール送信（Resend）

### 4.2 `GET /api/newsletter/confirm?token=xxx`

確認処理。

| 項目 | 内容 |
|------|------|
| パラメータ | `token` (verify_token) |
| 処理 | `status` → `active`、`verified_at` 記録 |
| リダイレクト | `/newsletter/confirmed?status=success` or `?status=error` |

### 4.3 `GET /api/newsletter/unsubscribe?token=xxx`

配信停止処理。

| 項目 | 内容 |
|------|------|
| パラメータ | `token` (unsubscribe_token) |
| 処理 | `status` → `unsubscribed`、`unsubscribed_at` 記録 |
| リダイレクト | `/newsletter/unsubscribed?status=success&token=xxx` or `?status=error` |

### 4.4 `POST /api/cron/send-newsletter`

日次配信（Vercel Cron から呼び出し）。

| 項目 | 内容 |
|------|------|
| 認証 | `Authorization: Bearer {CRON_SECRET}` |
| スケジュール | `15 23 * * *` UTC = JST 8:15 |
| 処理 | 最新 morning digest 取得 → active 購読者にバッチ送信（50通/バッチ） |
| ヘッダー | `List-Unsubscribe` / `List-Unsubscribe-Post` 付与 |
| ログ | `newsletter_send_logs` に記録 |

**処理フロー:**
1. CRON_SECRET 認証
2. 当日送信済みチェック（二重送信防止）
3. 最新 morning digest + NVA ランキング取得
4. active 購読者リスト取得
5. send_log 作成
6. 50通ずつ `Promise.allSettled` でバッチ送信
7. send_log 更新（成功/失敗数）

---

## 5. メールテンプレート

React Email (`@react-email/components`) で実装。

### 5.1 確認メール (`src/emails/verification.tsx`)

```
┌─────────────────────────────┐
│   AI Solo Builder (ロゴ)     │
├─────────────────────────────┤
│                             │
│  ニュースレター登録の確認     │
│                             │
│  ご登録ありがとうございます。  │
│  以下のボタンで確認を...      │
│                             │
│  ┌───────────────────────┐  │
│  │   登録を確認する       │  │
│  └───────────────────────┘  │
│                             │
│  心当たりがない場合は無視...   │
│                             │
├─────────────────────────────┤
│  AI Solo Builder ©          │
└─────────────────────────────┘
```

### 5.2 朝刊 Digest メール (`src/emails/morning-digest.tsx`)

```
┌─────────────────────────────┐
│   AI Solo Builder (ロゴ)     │
├─────────────────────────────┤
│  2026-02-19                  │
│  朝刊タイトル                │
│  サマリー...                 │
├─────────────────────────────┤
│  ▶ Top 3 ヘッドライン       │
│  ┌─────────────────────┐    │
│  │ 1 ヘッドライン1      │    │
│  │   NVA: 85/100       │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 2 ヘッドライン2      │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 3 ヘッドライン3      │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  ▶ NVA ランキング 4-10      │
│  #4 ヘッドライン4 (72pt)     │
│  #5 ヘッドライン5 (68pt)     │
│  ...                        │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ サイトで全文を読む     │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  配信停止はこちら            │
│  AI Solo Builder ©          │
└─────────────────────────────┘
```

### 5.3 共有コンポーネント

| ファイル | 内容 |
|---------|------|
| `src/emails/components/email-header.tsx` | ロゴ（グラデーションテキスト） |
| `src/emails/components/email-footer.tsx` | 配信停止リンク + コピーライト |

### 5.4 デザイン仕様

- 背景色: `#0f172a`（サイトの dark navy と統一）
- フォント: Inter, Noto Sans JP
- CTA ボタン: `linear-gradient(to right, #3B82F6, #8B5CF6)`
- Top3 ランクバッジ: 金/銀/銅グラデーション

---

## 6. フロントエンド

### 6.1 コンポーネント

| ファイル | 種別 | 役割 |
|---------|------|------|
| `src/components/NewsletterButton.tsx` | client | ヘッダーCTA（デスクトップ: テキスト+アイコン / モバイル: アイコンのみ） |
| `src/components/NewsletterModal.tsx` | client | モーダルダイアログ（ポータル、フォーカストラップ、Escape閉じ） |
| `src/components/NewsletterForm.tsx` | client | 共有フォーム（modal/inline/footer 対応、全状態管理） |
| `src/components/NewsletterInlineSignup.tsx` | client | ホームページ用インライン CTA セクション |

### 6.2 ページ

| パス | 種別 | 役割 |
|------|------|------|
| `/newsletter/confirmed` | server | 確認完了ページ（成功/エラー表示） |
| `/newsletter/unsubscribed` | client | 配信停止ページ（フィードバックフォーム付き） |

### 6.3 デザイン

- **モーダル:** `z-[60]`, `bg-black/60 backdrop-blur-sm` オーバーレイ, `bg-[var(--bg-card)]` コンテナ
- **CTA ボタン:** `bg-gradient-to-r from-blue-500 to-violet-500`（ロゴのグラデーションと統一）
- **インラインセクション:** `bg-gradient-to-br from-blue-500/10 via-violet-500/8 to-emerald-500/5`
- **バッジ:** 「無料」「毎朝 8:15 配信」「解除はいつでも」の3つ
- **成功状態:** フォームを checkmark + メッセージに差し替え
- **アニメーション:** `globals.css` に `newsletter-overlay-in` / `newsletter-content-in` keyframes

### 6.4 既存ファイルへの統合

| ファイル | 変更内容 |
|---------|---------|
| `src/app/layout.tsx` | ヘッダー Actions に `NewsletterButton` 追加 |
| `src/app/page.tsx` | ニュースとプロダクトの間に `NewsletterInlineSignup` 挿入 |
| `src/app/globals.css` | モーダルアニメーション keyframes 追加 |

---

## 7. Vercel Cron 設定

ファイル: `vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/send-newsletter",
    "schedule": "15 23 * * *"
  }]
}
```

- `15 23 * * *` UTC = JST 08:15
- Hobby プラン: 1 cron/日（このユースケースに適合）
- 認証: `CRON_SECRET` ヘッダーで Vercel が自動付与

---

## 8. 環境変数

| 変数 | 用途 | 設定場所 |
|------|------|---------|
| `RESEND_API_KEY` | Resend API キー | `.env.local` + Vercel |
| `CRON_SECRET` | Vercel Cron 認証シークレット | `.env.local` + Vercel |
| `NEXT_PUBLIC_SITE_URL` | サイトURL（メール内リンク生成） | Vercel（未設定時は `https://ai.essential-navigator.com`） |

---

## 9. セキュリティ

| 対策 | 実装 |
|------|------|
| ボット防止 | ハニーポットフィールド (`_hp`) |
| レート制限 | 同一 IP から 1h に 5回まで（Supabase クエリ） |
| メール検証 | 正規表現 + 長さ制限（254文字） |
| Cron 認証 | `Authorization: Bearer {CRON_SECRET}` |
| RLS | `anon` / `authenticated` アクセス不可、`service_role` のみ |
| List-Unsubscribe | RFC 8058 準拠ヘッダー（ワンクリック配信停止） |
| 二重送信防止 | `send_date` で当日送信済みチェック |

---

## 10. コスト見積もり

| 購読者数 | Resend | Vercel | Supabase | 月額合計 |
|---------|--------|--------|----------|---------|
| ~100人 | 無料 | 無料 | 無料 | **$0** |
| ~1,000人 | $20 | 無料 | 無料 | **$20** |
| ~10,000人 | $100 | $20 | 無料 | **$120** |

---

## 11. Resend ドメイン認証手順

1. [Resend ダッシュボード](https://resend.com/domains) でドメイン追加: `ai.essential-navigator.com`
2. 表示される DNS レコード（SPF, DKIM, DMARC）を Route 53 に追加
3. Resend で認証確認（通常数分〜数時間）
4. 認証完了後、`from` アドレスとして `newsletter@ai.essential-navigator.com` が使用可能に

---

## 12. 将来拡張

| 機能 | 実装方針 |
|------|---------|
| Resend Webhook | bounce/complaint を自動検知、`status` を `bounced` / `complained` に更新 |
| 有料ニュースレター | `tier` カラムで free/pro を分離、Pro 限定コンテンツ配信 |
| 配信設定 | `preferences` jsonb で曜日指定・カテゴリフィルタ |
| 夕刊配信 | cron 追加 + `evening-digest.tsx` テンプレート作成 |
| 開封/クリック追跡 | Resend Analytics API 連携 |
| A/B テスト | 件名のバリエーションテスト |

---

## 13. ファイル一覧

```
src/
├── lib/newsletter.ts                       # 共有ライブラリ（DB操作・バリデーション）
├── emails/
│   ├── verification.tsx                    # 確認メールテンプレート
│   ├── morning-digest.tsx                  # 朝刊 Digest メールテンプレート
│   └── components/
│       ├── email-header.tsx                # 共有ヘッダー
│       └── email-footer.tsx                # 共有フッター
├── components/
│   ├── NewsletterButton.tsx                # ヘッダーCTA
│   ├── NewsletterModal.tsx                 # モーダルダイアログ
│   ├── NewsletterForm.tsx                  # 共有フォーム
│   └── NewsletterInlineSignup.tsx          # インラインCTA
├── app/
│   ├── api/
│   │   ├── newsletter/
│   │   │   ├── subscribe/route.ts          # 登録API
│   │   │   ├── confirm/route.ts            # 確認API
│   │   │   └── unsubscribe/route.ts        # 配信停止API
│   │   └── cron/
│   │       └── send-newsletter/route.ts    # 日次配信API
│   └── newsletter/
│       ├── confirmed/page.tsx              # 確認完了ページ
│       └── unsubscribed/page.tsx           # 配信停止ページ
supabase/
└── migrations/
    └── 20260219000000_add_newsletter.sql   # DBマイグレーション
vercel.json                                 # Cron設定
```

---

*このドキュメントは CLAUDE.md の技術仕様・ARCHITECTURE.md・API.md・DATABASE.md と整合。変更時は関連ドキュメントも更新すること。*
