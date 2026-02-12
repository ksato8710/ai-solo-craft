# Claude Code ルーティン運用手順（朝刊/夕刊 + Top3）

このドキュメントは、AI Solo Builder の日次記事作成ワークフローの概要を示す。

**関連ドキュメント:**
- ワークフロー全体設計: `docs/WORKFLOW-ARCHITECTURE.md`（包括ドキュメント）
- 品質チェック: `docs/CHECKLIST.md`
- 運営計画: `docs/OPERATIONS-PLAN-2026-02-12.md`

## ワークフロー概要（4 Phase）

各Phaseには対応するスキルがある。詳細手順はスキルを参照。

| Phase | スキル | 概要 |
|-------|--------|------|
| 1. 調査 | `news-research` | ニュース収集・一次ソース確認・DB保存 |
| 2. 評価 | `news-evaluation` | 期間フィルタ・NVA・Top10選定 |
| 3. 記事作成 | `digest-writer` | Digest + Top3記事作成 |
| 4. 公開 | `publish-gate` | チェックリスト照合・デプロイ・報告 |

## 生成するもの（毎日）
- 朝刊（Digest）: `category: morning-summary`
- 夕刊（Digest）: `category: evening-summary`
- 個別ニュース（Top 3）: `category: news`（DigestのTop 3ぶん）

補足:
- プロダクト辞書（`content/products/*.md`）は、記事内に登場したプロダクトの“前提情報”として随時作成/更新する
- ナレッジ（`dev-knowledge`）/ 事例（`case-study`）は不定期だが、運用ループは同じ

## 役割定義（運用）
- プロダクトオーナー兼編集長: ClaudeCode（openClaw）
- 最終承認者: 人間オーナー
- 実装・自動化: Codex 等の実装エージェント

## 重要ポリシー（必読）
- taxonomy・リンク運用は `specs/content-policy/spec.md` を正とする
- Digestは「ランキングTop 10（最大）」+「Top 3深掘り」+「Top 3は個別ニュース記事」までが1セット
- `/news-value` は最新のDigest記事内のランキング表から自動生成される（特別な更新作業は不要）
- 記事公開は **DB登録完了が前提**。`sync:content:db` に失敗した変更は公開しない

## 環境前提（最初に1回）

`.env.local`（または`.env`）に以下を設定する。`sync:content:db` はこのファイルを自動読込する。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SECRET_KEY=<secret-key>
```

## ファイル命名（推奨）
- 朝刊: `content/news/YYYY-MM-DD-morning-news-YYYY-MM-DD.md`
  - `slug: "morning-news-YYYY-MM-DD"`
  - `category: "morning-summary"`
- 夕刊: `content/news/YYYY-MM-DD-evening-news-YYYY-MM-DD.md`
  - `slug: "evening-news-YYYY-MM-DD"`
  - `category: "evening-summary"`
- 個別ニュース: `content/news/YYYY-MM-DD-some-slug.md`
  - `slug: "some-slug"`
  - `category: "news"`

## 手順（朝刊/夕刊 共通）

**各Phaseの詳細手順はスキルを参照。**

### Phase 1: 調査（→ `news-research` スキル）

- ソース巡回（RSS/検索）
- 一次ソース特定・日付確認
- `news_candidates` テーブルに保存

**完了条件:** 8〜15件の候補がDB保存済み、全件に一次ソースURL・発表日あり

### Phase 2: 評価（→ `news-evaluation` スキル）

- 期間適切性フィルタ（朝刊: 前夕刊〜今朝刊、夕刊: 前朝刊〜今夕刊）
- 事実確認（誇張・歪曲チェック）
- NVAスコアリング → Top10/Top3選定

**完了条件:** Top10が `status=selected`、Top3が確定

### Phase 3: 記事作成（→ `digest-writer` スキル）

- Digest記事作成（テンプレート厳守）
- Top3個別記事作成
- プロダクトリンク整備

**完了条件:** Digest 1本 + Top3個別記事 3本作成済み

### Phase 4: 公開（→ `publish-gate` スキル）

```bash
npm run publish:gate
git add -A
git commit -m "publish: YYYY-MM-DD morning/evening"
git push
```

**完了条件:** デプロイ完了、Slack報告済み

---

## 簡易フロー図

```
news-research → news-evaluation → digest-writer → publish-gate
    │                │                  │               │
    ▼                ▼                  ▼               ▼
  DB保存          Top10確定         記事作成        公開・報告
```

## モデルケース（本日のサンプル）
- 朝刊: `content/news/2026-02-10-morning-news-2026-02-10.md`
- 夕刊: `content/news/2026-02-10-evening-news-2026-02-10.md`
- 個別ニュース（Top 3）:
  - `content/news/2026-02-10-claude-code-project-memory.md`
  - `content/news/2026-02-10-cursor-shared-rules.md`
  - `content/news/2026-02-10-openai-codex-review-mode.md`
- ナレッジ（例）: `content/news/2026-02-10-spec-first-context-pack.md`
- 事例（例）: `content/news/2026-02-10-sleek-design-10k-mrr-case-study.md`
- プロダクト（例）: `content/products/continue-dev.md`
