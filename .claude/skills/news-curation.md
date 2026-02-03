# News Curation — ニュースキュレーションスキル

## 概要
グローバルのAI情報ソースを効率的に巡回し、記事化すべきニュースを選定する手順。

## 巡回手順

### Step 1: 主要ソースのスキャン
1. **Hacker News** — AI関連でupvote 100+の記事を抽出
2. **Reddit** — r/solopreneur, r/SideProject, r/artificial の直近24h人気投稿
3. **X** — @levelsio, @marc_louvion, @dannypostma 等の投稿 + "AI tool" "vibe coding" 検索
4. **Product Hunt** — デイリーAI系ランキング上位

### Step 2: 一次スクリーニング
以下の基準で候補を5-10本に絞る:
- コミュニティの反応量（upvote/RT/コメント数）
- ソロビルダーとの関連度
- 情報の鮮度（24h以内を優先）
- 既存記事との重複チェック

### Step 3: NVA概算スコアリング
各候補にNVAの5軸でざっくりスコアをつける:
- SNS反応量 (0-20)
- メディアカバレッジ (0-20)
- コミュニティ反応 (0-20)
- 技術的インパクト (0-20)
- ソロビルダー関連度 (0-20)

### Step 4: 記事化決定
- Tier A (80+): 必ず記事化
- Tier B (55-79): 当日のネタ量に応じて判断
- Tier C (30-54): 他にネタがなければ検討
- Tier D (1-29): スキップ

## ソースデータの保存
- research/YYYY-MM-DD-slug/ に sources.md を作成
- URL・数値・引用原文を保存（将来のリファレンス資産）

## 参照ドキュメント
- docs/RESEARCH-SOURCES.md — 巡回先の詳細リスト
- docs/CONTENT-STRATEGY.md — カテゴリ別の選定基準
