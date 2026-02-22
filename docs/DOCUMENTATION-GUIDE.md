# ドキュメント・スキル管理ガイド

本ドキュメントは、ai-solo-builder リポジトリ内のドキュメント体系・スキル・エージェント定義の構造と運用ルールを定義する。

> **対象読者:** このリポジトリで作業する AI エージェントおよび人間の開発者
> **更新:** ドキュメントの追加・移動・削除時に本ファイルも必ず更新する

---

## 1. 情報の優先順位（Single Source of Truth）

```
specs/                  ← 最上位：正規仕様（変更には承認が必要）
  ↓ 準拠
docs/                   ← 運用レベルの詳細手順・ガイドライン
  ↓ 要約
CLAUDE.md               ← 索引＋クイックリファレンス（全体の入口）
  ↓ 抽出
.claude/skills/         ← エージェントが即座に参照するスキルカード
.claude/agents/         ← エージェント定義（役割・使用スキル・入出力）
```

**原則:**
- 矛盾が生じた場合は上位が正（specs > docs > CLAUDE.md > skills）
- スキルは docs の「要約版」であり、独自の仕様を持たない
- CLAUDE.md は索引であり、詳細を書く場所ではない

---

## 2. ディレクトリ構成と各ファイルの目的

### specs/ — 正規仕様

変更には承認が必要。他の全ドキュメントはここに準拠する。

| ファイル | 目的 | 主な参照元 |
|---------|------|-----------|
| `content-policy/spec.md` | コンテンツ3型分類、frontmatter契約、タグモデル | article-template, editorial-standards, site-config |
| `content-model-db/spec.md` | DBエンティティ設計、マイグレーションマップ | site-config, DATABASE.md |

### docs/business/ — 事業設計

プロダクトの「なぜ」「誰に」「どう差別化するか」を定義。

| ファイル | 目的 | 主な参照元 |
|---------|------|-----------|
| `CONCEPT.md` | ビジョン・ターゲット・差別化・コンテンツ5種類定義 | article-template, brand-voice |
| `LEAN-CANVAS.md` | 事業モデル（課題・価値・収益・コスト） | — |
| `BRAND-IDENTITY.md` | トーン・文体・ビジュアル・カラーパレット | brand-voice |

### docs/operations/ — 運用

日常の記事作成・品質管理の手順書。エージェントが最も頻繁に参照する。

| ファイル | 目的 | 主な参照元 |
|---------|------|-----------|
| `WORKFLOW-OVERVIEW.md` | ワークフロー全体像、スキル体系、cron設定 | CLAUDE.md, 各スキル |
| `WORKFLOW-DIGEST.md` | 朝刊/夕刊 Digest の5Phase手順 | news-curation, nva-process |
| `WORKFLOW-INDIVIDUAL.md` | 個別記事（dev-knowledge/case-study）の5Phase手順 | nva-process |
| `CHECKLIST.md` | 品質チェックリスト（公開前/日次/週次/月次） | editorial-standards, publisher |
| `EDITORIAL.md` | タイトルルール・編集ガイドライン | editorial-standards, brand-voice, quality-checker |
| `CONTENT-STRATEGY.md` | SEOキーワード戦略、内部リンク戦略、カテゴリ統合マップ | news-curation |
| `RESEARCH-SOURCES.md` | 巡回先リスト・リサーチ手順 | research-sources, news-curation |

### docs/technical/ — 技術

サイト構成・API・DB設計。実装者向け。

| ファイル | 目的 |
|---------|------|
| `ARCHITECTURE.md` | ディレクトリ構造、ページ構成、frontmatter仕様、デプロイ手順 |
| `API.md` | Content API 仕様（Web/Flutter共通） |
| `DATABASE.md` | Supabase設定・スキーマ・RLS |
| `NEWSLETTER.md` | ニュースレター機能の技術仕様・アーキテクチャ |
| `FLUTTER.md` | Flutter モバイルアプリ連携仕様 |
| `ADMIN.md` | 管理画面・運用管理手順 |

### docs/archive/ — アーカイブ

実装完了済みの設計アーティファクトや旧文書。参照のみ、更新しない。

| ファイル | アーカイブ理由 |
|---------|--------------|
| `SOURCE-CREDIBILITY-SPEC.md` | 設計完了・実装済み（実装仕様は WORKFLOW-OVERVIEW.md に統合） |
| `OPERATIONS-PLAN-2026-02-12.md` | 当日限りの運営計画 |
| `MANUAL-SQL-SETUP.md` | 初期構築時の手動SQL（自動化済み） |

---

## 3. スキル・エージェント体系

### .claude/skills/ — スキルカード

エージェントが作業中に即座に参照する「要約版」ガイドライン。

| スキル | 役割 | docs との対応 |
|--------|------|-------------|
| `news-curation.md` | ニュース巡回・スクリーニング手順 | WORKFLOW-DIGEST Phase 1-2, RESEARCH-SOURCES |
| `article-template.md` | 記事種別テンプレート + frontmatter | specs/content-policy, WORKFLOW-DIGEST Phase 3 |
| `brand-voice.md` | ブランドトーン・文体ルール | BRAND-IDENTITY |
| `editorial-standards.md` | 編集基準・品質チェックリスト | EDITORIAL, CHECKLIST |
| `nva-process.md` | NVA（ニュースバリュー評価）手順 | WORKFLOW-DIGEST Phase 2, WORKFLOW-INDIVIDUAL |
| `site-config.md` | 技術仕様・デプロイ手順 | ARCHITECTURE, CHECKLIST |
| `research-sources.md` | 巡回先クイックリファレンス | RESEARCH-SOURCES |

### .claude/agents/ — エージェント定義

| エージェント | 使用スキル | ワークフロー上の担当 |
|-------------|-----------|-------------------|
| `news-scout.md` | news-curation, research-sources, nva-process | Digest Phase 1-2 |
| `article-writer.md` | article-template, brand-voice, editorial-standards, nva-process | Digest Phase 3-4, 個別記事 Phase 5 |
| `quality-checker.md` | editorial-standards, brand-voice | Digest/個別記事の品質ゲート |
| `publisher.md` | site-config | Digest Phase 5, 個別記事の公開 |

### 関係図

```
                    specs/content-policy/spec.md
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  docs/business/        docs/operations/       docs/technical/
  (なぜ・誰に)         (どうやって)            (どう作るか)
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────┐  ┌──────────────────────┐  ┌──────────┐
  │brand-    │  │news-curation         │  │site-     │
  │voice     │  │editorial-standards   │  │config    │
  │          │  │nva-process           │  │          │
  │          │  │article-template      │  │          │
  │          │  │research-sources      │  │          │
  └────┬─────┘  └──────────┬───────────┘  └────┬─────┘
       │                   │                    │
       ▼                   ▼                    ▼
  ┌──────────────────────────────────────────────────┐
  │              .claude/agents/                      │
  │  news-scout → article-writer → quality-checker   │
  │                                  → publisher     │
  └──────────────────────────────────────────────────┘
```

---

## 4. 運用ルール

### ドキュメントの追加

1. **どの層に置くか判断する:**
   - 承認が必要な仕様 → `specs/`
   - 手順・ガイドライン → `docs/operations/`
   - 事業戦略 → `docs/business/`
   - 技術仕様 → `docs/technical/`
2. **CLAUDE.md のドキュメントテーブルに追記する**
3. **関連するスキルがあれば、スキルの「参照ドキュメント」セクションにも追記する**
4. **本ファイルの該当テーブルを更新する**

### ドキュメントの変更

1. **上位ドキュメントから変更する**（specs → docs → CLAUDE.md → skills の順）
2. **影響を受ける下位ファイルを全て更新する**（Grep でパス参照を検索）
3. **スキルは docs の要約であり、スキル側に独自仕様を追加しない**

### ドキュメントのアーカイブ

1. `docs/archive/` に `git mv` で移動
2. ファイル冒頭にステータスバナーを追加:
   ```markdown
   > **Status:** アーカイブ（YYYY-MM-DD）
   > **理由:** [実装完了 / 統合済み / 期限切れ]
   > **後継:** [後継ドキュメントのパス]
   ```
3. 参照元のパスを更新する
4. 本ファイルの archive テーブルに追記する

### スキルの追加・変更

1. **必ず対応する docs が先に存在すること**（スキルは要約版）
2. スキルファイルの末尾に `## 参照ドキュメント` セクションを設け、正規ドキュメントへのパスを記載する
3. エージェント定義の `使用スキル` リストを更新する
4. CLAUDE.md のスキルテーブルを更新する
5. 本ファイルのスキルテーブルを更新する

### 命名規約

| 種類 | 規約 | 例 |
|------|------|-----|
| docs/ | `UPPER-KEBAB-CASE.md` | `WORKFLOW-DIGEST.md` |
| specs/ | `lower-kebab-case/spec.md` | `content-policy/spec.md` |
| skills/ | `lower-kebab-case.md` | `news-curation.md` |
| agents/ | `lower-kebab-case.md` | `news-scout.md` |

---

## 5. 整合性チェック手順

ドキュメントの大幅な変更後に実施する。

```bash
# 1. 壊れた docs パス参照を検出
grep -r "docs/" --include="*.md" . | grep -v node_modules | grep -v ".git"

# 2. 存在しないファイルへの参照を検出
grep -roh "docs/[a-zA-Z/-]*\.md\|specs/[a-zA-Z/-]*\.md" --include="*.md" . | sort -u | while read f; do
  [ ! -f "$f" ] && echo "BROKEN: $f"
done

# 3. レガシーカテゴリ名の残存チェック（specs/archive 以外）
grep -r "morning-summary\|evening-summary" --include="*.md" . | grep -v specs/ | grep -v archive/

# 4. スキルの参照ドキュメントセクション有無
for f in .claude/skills/*.md; do
  grep -q "参照ドキュメント" "$f" || echo "MISSING: $f に参照ドキュメントセクションなし"
done
```

---

*作成: 2026-02-16*
*統合元: ドキュメント再構成作業（docs/ サブディレクトリ化 + スキル整合性点検）*
