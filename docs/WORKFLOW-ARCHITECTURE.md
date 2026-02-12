# AI Solo Builder ワークフローアーキテクチャ

このドキュメントは、AI Solo Builder の記事作成ワークフロー、スキル、チェックリストの関係性を定義する。

---

## 📋 ドキュメント体系

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW-ARCHITECTURE.md                      │
│                    （本ドキュメント・包括）                        │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  ワークフロー   │     │    スキル     │     │ チェックリスト │
│   (プロセス)   │     │  (実行手順)   │     │  (品質ゲート)  │
└───────────────┘     └───────────────┘     └───────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
CLAUDE-CODE-ROUTINE.md   ~/.clawdbot/skills/    CHECKLIST.md
(ルーティン手順書)         ├─ news-research/
                          ├─ news-evaluation/
                          ├─ digest-writer/
                          └─ publish-gate/
```

---

## 🔄 ワークフロー（プロセス）

**定義:** 記事作成の全体フロー。どの順番で何をするか。

```
Phase 1          Phase 2          Phase 3          Phase 4
[調査] ──────▶ [評価・選定] ──────▶ [記事作成] ──────▶ [公開]
   │                │                  │                │
   ▼                ▼                  ▼                ▼
news_candidates  selected候補      Markdown記事      本番公開
(DB保存)         (NVA付き)          (Top3個別含む)    (Vercel)
```

### Phase間の責務分離

| Phase | 責務 | 入力 | 出力 |
|-------|------|------|------|
| 1. 調査 | 一次ソース特定・日付確認・DB保存 | ソース巡回 | news_candidates (collected) |
| 2. 評価 | 期間フィルタ・NVA・事実確認 | collected候補 | selected候補 (Top10/Top3) |
| 3. 記事作成 | Digest + Top3個別記事執筆 | selected候補 | Markdownファイル |
| 4. 公開 | チェックリスト照合・デプロイ | Markdownファイル | 本番サイト |

---

## 🛠️ スキル（実行手順）

**定義:** 各Phaseの具体的な実行手順。エージェントが従う手順書。

### スキル一覧

| Phase | スキル名 | 場所 | 説明 |
|-------|----------|------|------|
| 1 | news-research | `~/.clawdbot/skills/news-research/` | ニュース収集・一次ソース確認・DB保存 |
| 2 | news-evaluation | `~/.clawdbot/skills/news-evaluation/` | 期間フィルタ・NVA・Top10選定 |
| 3 | digest-writer | `~/.clawdbot/skills/digest-writer/` | Digest + Top3記事作成 |
| 4 | publish-gate | `~/.clawdbot/skills/publish-gate/` | 最終チェック・デプロイ・報告 |

### スキル間の依存関係

```
news-research
     │
     │ news_candidates (status=collected)
     ▼
news-evaluation
     │
     │ news_candidates (status=selected, nva_score, rank)
     ▼
digest-writer
     │
     │ content/news/*.md
     ▼
publish-gate
     │
     │ git push → Vercel deploy
     ▼
   公開完了
```

### 既存スキルとの関係

| スキル | 用途 | AI Solo Builderとの関係 |
|--------|------|-------------------------|
| article-writer | Essential Navigator（WordPress）用 | **別系統**（AI Solo Builderでは使わない） |
| thumbnail-generator | サムネイル生成 | digest-writer から必要時に呼び出し |
| site-checker | 公開後のUI確認 | publish-gate から呼び出し |

---

## ✅ チェックリスト（品質ゲート）

**定義:** 公開可否を判断する基準。何を満たすべきか。

### チェックリストの配置

```
docs/CHECKLIST.md
├── 🔴 公開前チェック（毎回必須）
│   ├── Frontmatter整合性
│   ├── Digest必須構造
│   ├── サムネイル・画像チェック
│   ├── リンク整合性
│   └── ゲート通過
├── 🟠 ビジュアル・UI チェック（デプロイ後）
├── 🟡 日次チェック
├── 🟢 週次チェック
└── 🔵 月次チェック
```

### スキルとチェックリストの対応

| スキル | 対応するチェック項目 |
|--------|---------------------|
| news-research | 一次ソースURL確認、発表日確認 |
| news-evaluation | 期間適切性、事実確認、NVAスコア |
| digest-writer | Frontmatter、Digest構造、画像、リンク |
| publish-gate | ゲート通過、デプロイ確認、Slack報告 |

---

## 📅 日次運用との対応

### 朝刊ワークフロー（07:30開始 → 08:00公開）

```
07:30  news-research (morning, targetDate)
       ├─ ソース巡回（前日夕刊〜今朝刊の期間）
       └─ news_candidates に8-15件保存

07:40  news-evaluation
       ├─ 期間フィルタ
       ├─ NVAスコアリング
       └─ Top10/Top3選定

07:50  digest-writer
       ├─ Digest記事作成
       ├─ Top3個別記事作成
       └─ プロダクトリンク整備

07:55  publish-gate
       ├─ チェックリスト照合
       ├─ npm run publish:gate
       ├─ git push
       └─ Slack報告

08:00  公開完了
```

### 夕刊ワークフロー（17:30開始 → 18:00公開）

```
17:30  news-research (evening, targetDate)
       └─ ソース巡回（今朝刊〜今夕刊の期間）

17:40  news-evaluation
       └─ 朝刊との重複排除 + NVA

17:50  digest-writer
       └─ Digest + Top3

17:55  publish-gate
       └─ チェック・デプロイ・報告

18:00  公開完了
```

---

## 🗄️ データフロー

### news_candidates テーブル

```sql
CREATE TABLE news_candidates (
  id UUID PRIMARY KEY,
  edition TEXT NOT NULL,           -- 'morning' | 'evening'
  target_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT NOT NULL,        -- 一次ソース（必須）
  source_name TEXT,
  published_at TIMESTAMPTZ,        -- 発表日時（必須）
  
  -- Phase 2で追加
  status TEXT DEFAULT 'collected', -- collected | evaluated | selected | rejected
  nva_n INT,
  nva_v INT,
  nva_a INT,
  nva_c INT,
  nva_t INT,
  nva_score INT,
  nva_tier TEXT,
  rank INT,
  top3 BOOLEAN DEFAULT false,
  
  collected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### ステータス遷移

```
collected → evaluated → selected → (記事作成後) completed
                     ↘ rejected
```

---

## 📝 ルーティン手順書との関係

`docs/CLAUDE-CODE-ROUTINE.md` は、ワークフロー全体の概要と文脈を提供する。

スキルは、各Phaseの詳細な実行手順を提供する。

```
CLAUDE-CODE-ROUTINE.md
├── 「何を作るか」の概要
├── 役割定義
├── ファイル命名規則
└── 各Phaseへの参照（→ スキルを呼び出し）

各スキル（SKILL.md）
├── 「どうやるか」の詳細手順
├── コマンド・SQLの具体例
└── 完了条件
```

---

## 🔗 関連ドキュメント

| ドキュメント | 場所 | 内容 |
|-------------|------|------|
| ルーティン手順書 | `docs/CLAUDE-CODE-ROUTINE.md` | ワークフロー概要 |
| チェックリスト | `docs/CHECKLIST.md` | 品質基準・自動化状況 |
| コンテンツポリシー | `specs/content-policy/spec.md` | taxonomy・リンク規則 |
| 運営計画 | `docs/OPERATIONS-PLAN-2026-02-12.md` | 運営方針・優先度 |
| news-research | `~/.clawdbot/skills/news-research/SKILL.md` | Phase 1 手順 |
| news-evaluation | `~/.clawdbot/skills/news-evaluation/SKILL.md` | Phase 2 手順 |
| digest-writer | `~/.clawdbot/skills/digest-writer/SKILL.md` | Phase 3 手順 |
| publish-gate | `~/.clawdbot/skills/publish-gate/SKILL.md` | Phase 4 手順 |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-02-12 | 初版作成（ワークフロー・スキル・チェックリストの包括整理） |
