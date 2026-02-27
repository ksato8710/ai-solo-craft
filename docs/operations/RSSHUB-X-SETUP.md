# RSSHub + X 自前運用セットアップ（Docker なし）

更新日: 2026-02-27

## 目的

低コスト優先で X の主要発信元を定期収集するために、RSSHub を自前で動かし、既存の `collect-sources` パイプラインへ接続する。

この構成の前提:

- RSSHub は OSS なので無料（運用費はサーバ代のみ）
- X の `TWITTER_AUTH_TOKEN`（Web Cookie）を使う
- X 公式 Developer API の従量課金は使わない
- RSSHub は `~/dev/RSSHub` に共通配置し、複数プロジェクトで使い回す

## あなた側で必要な作業

1. X の `auth_token` を取得する
2. `~/dev/RSSHub` を用意して起動する（Docker 不要）
3. AI Solo Craft 側に `RSSHUB_BASE_URL` を設定する
4. DB に X ソースと crawl 設定を投入する
5. 定期実行（cron）を 30-60 分間隔にする

## 1) X auth_token を取得

注意:

- 必要なのは OAuth トークンではなく、X Web の Cookie `auth_token`
- 利用は自己責任で。運用前に規約を確認する

取得例:

1. ブラウザで `x.com` にログイン
2. 開発者ツール -> Application/Storage -> Cookies
3. `auth_token` の値をコピー

## 2) RSSHub を ~/dev に配置して起動

前提:

- Node.js: `22.20+` または `24+`
- `pnpm` が使えること

初回セットアップ:

```bash
cd ~/dev
git clone https://github.com/DIYgod/RSSHub.git
cd ~/dev/RSSHub
pnpm install
pnpm build
```

`~/dev/RSSHub/.env` を作成:

```bash
PORT=1200
TWITTER_AUTH_TOKEN=xxxxxxxxxxxxxxxx
CACHE_TYPE=memory
```

複数トークン運用する場合はカンマ区切り:

```bash
TWITTER_AUTH_TOKEN=token1,token2,token3
```

起動:

```bash
cd ~/dev/RSSHub
pnpm start
```

疎通確認:

```bash
curl "http://127.0.0.1:1200/twitter/user/AnthropicAI"
```

## 3) AI Solo Craft 側の設定

`.env.local` に RSSHub URL を設定:

```bash
RSSHUB_BASE_URL=http://127.0.0.1:1200
```

## 4) AI Solo Craft DB に X ソースを登録

`watchlist.json` のアカウント群を `sources` と `source_crawl_configs` に upsert する:

```bash
cd /Users/satokeita/Dev/ai-solo-craft
node scripts/setup-rsshub-x-sources.mjs
```

ドライラン:

```bash
node scripts/setup-rsshub-x-sources.mjs --dry-run
```

このスクリプトは次を実施する:

- `sources` に `x.com/<handle>` 形式で upsert
- `source_crawl_configs` に RSS URL (`/twitter/user/<handle>/includeReplies=false&includeRts=false`) を upsert

## 5) 定期実行設定

既存の `collect-sources` を 30-60 分間隔で実行する（Vercel Hobby の 1日1回制限がある場合は GitHub Actions などを使用）。

実行エンドポイント:

- `POST /api/cron/collect-sources`
- Header: `Authorization: Bearer <CRON_SECRET>`

## auth_token 更新の運用目安

- 固定の更新周期はない（「毎週」「毎月」のような確定ルールはない）
- 実運用では「数日で無効化」から「数か月維持」までばらつきがある
- 403/401 か `Twitter cookie ... is not valid` が出たら即ローテーションする
- 重要運用では 2-3 個のトークンを事前に用意しておく

## 運用メモ

- 最初は Tier1 のみで開始し、安定後に Tier2/Tier3 を有効化
- 欠損対策として重要ソースだけ一次情報（公式ブログ）でも二重監視する
