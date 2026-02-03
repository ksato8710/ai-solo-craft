# AI Solo Builder — リサーチソース一覧

*作成日: 2026-02-03*

---

## 主要巡回先（毎日必ずチェック）

### 1. X (Twitter)
- **対象アカウント:**
  - Pieter Levels (@levelsio) — ソロファウンダーの代表格
  - Marc Lou (@marc_louvion) — ShipFast等のソロビルダー
  - Danny Postma (@dannypostma) — HeadshotPro等
  - Greg Isenberg (@gregisenberg) — スタートアップアイデア
  - その他AI界隈の主要アカウント
- **検索キーワード:** "AI tool", "solo builder", "vibe coding", "ship fast", "MRR"
- **用途:** リアルタイムの熱気、個人開発者の生の声、バイラルコンテンツの発見

### 2. Reddit
- **対象サブレディット:**
  - r/solopreneur — ソロ起業家の議論
  - r/SideProject — サイドプロジェクトの共有
  - r/buildinpublic — 公開開発の知見
  - r/artificial — AI全般の議論
  - r/ChatGPT — ChatGPT関連
  - r/LocalLLaMA — ローカルLLM
- **用途:** コミュニティの深い議論、ツールの実使用レポート、トレンドの検出

### 3. Hacker News
- URL: news.ycombinator.com
- **選定基準:** AI関連でupvote 100+の記事、コメント50+の活発な議論
- **用途:** 技術的話題の重要度指標（HNで話題 ＝ テック界で重要）
- **最重要ベンチマーク:** ASBが目指す「毎日まず見る場所」のポジション

### 4. Product Hunt
- URL: producthunt.com
- **選定基準:** AI系プロダクトのデイリーランキング上位
- **用途:** 新プロダクトの早期発見、upvote数による注目度の定量化

---

## ニュースメディア

### 5. TechCrunch
- AI/ML カテゴリ
- **用途:** 資金調達ニュース、企業の公式発表

### 6. The Verge
- AI セクション
- **用途:** 大手テック企業のAI動向、一般向けAI製品

### 7. Ars Technica
- AI セクション
- **用途:** 技術的に深い分析記事

### 8. VentureBeat
- AI セクション
- **用途:** エンタープライズAI、資金調達

---

## ニュースレター・キュレーション

### 9. Ben's Bites
- **用途:** AI業界の「まず読むレター」。トーンの参考にもなる

### 10. TLDR Newsletter
- **用途:** キュレーション形式の参考。UIのベンチマーク

### 11. There's An AI For That
- URL: theresanaiforthat.com
- **用途:** AIツールディレクトリ。網羅性の参考

---

## リサーチ手順

### 朝のAIニュース（morning-news）作成時
```
1. Hacker News のAI関連上位記事をチェック（upvote数で重要度判断）
2. Reddit 主要サブレディットの直近24h人気投稿を確認
3. X でAI関連のトレンド・バイラルを確認
4. Product Hunt のデイリーランキングを確認
5. TechCrunch/The Verge のAIカテゴリをスキャン
6. 上記から NVA Tier A/B の記事を選定
7. 日本のソロビルダー視点で文脈を添えて記事化
```

### 注目ツール（featured-tools）作成時
```
1. Product Hunt / HN / Reddit で話題のツールを特定
2. ツールの公式サイトで基本情報収集（開始時期・運営・料金）
3. 定量データ収集（MAU・調達額・GitHub Stars・ユーザー数）
4. X / Reddit でユーザーの生の声を収集
5. 競合ツールとの比較ポイントを整理
6. NVA評価を実施（5軸×20点=100点満点）
7. 中間資料を research/ に保存
8. ソロビルダー視点の活用方法を添えて記事化
```

### 深掘り・ハウツー（deep-dive）作成時
```
1. テーマに関する一次ソース（公式ドキュメント・論文等）を確認
2. HN / Reddit の関連スレッドから深い議論を収集
3. 実践者のブログ・X投稿から実使用の知見を収集
4. 日本市場での適用可能性を分析
5. 構造化された解説記事を作成
```

---

## NVA（ニュースバリュー評価）の実施

featured-tools と morning-news の主要記事には NVA を実施:

- **スキル:** `clawd-stevens/skills/news-value-assessment/SKILL.md`
- **5軸:** SNS反応量 / メディアカバレッジ / コミュニティ反応 / 技術的インパクト / ソロビルダー関連度
- **各20点 = 100点満点**
- **Tier:** A(80-100) / B(55-79) / C(30-54) / D(1-29)
- **中間資料:** `ai-solo-builder/research/YYYY-MM-DD-slug/` に保存

---

*このリサーチ手順は記事作成において必須。省略不可。*
