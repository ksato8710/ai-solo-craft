# 情報源信頼性レイヤー機能仕様書

> **Status:** 設計アーティファクト（2026-02-13 に実装完了）
> - **実装済みアーキテクチャ:** `docs/operations/WORKFLOW-OVERVIEW.md` Section「ソース管理システム」が正規の実装仕様
> - **本文書の有効な部分:** UI/UX仕様（Section 3）、API仕様（Section 4）は参考として有効
> - **注意:** DBスキーマ（Section 5）は実装時に変更あり — テーブル名 `sources`、スコア型 `DECIMAL(3,1)` に変更済み

## 1. 概要

### 目的
AIソロ開発者が情報の出所と信頼性を瞬時に判断できる機能を提供し、意思決定の精度とスピードを向上させる。

### 価値提供
- **情報の透明性**: 一次/二次/三次ソースの明確な分類
- **意思決定支援**: 信頼度ベースの情報フィルタリング
- **時間効率**: 情報の重要度を瞬時に判断可能

## 2. 機能要件

### 2.1 情報源分類システム

#### 分類レベル（3層構造）

**🥇 Primary（一次情報）**
- **定義**: 情報の原典・公式発表
- **例**: OpenAI Blog、Meta Research、GitHub Release、企業決算報告
- **特徴**: 事実の発生元、編集フィルタなし
- **信頼度**: 9-10

**🥈 Secondary（二次情報）**
- **定義**: 専門編集部による分析・報道
- **例**: TechCrunch、The Verge、InfoQ、IEEE Spectrum
- **特徴**: 編集・分析・文脈付与あり
- **信頼度**: 6-8

**🥉 Tertiary（三次情報）**
- **定義**: コミュニティ・個人による議論・解釈
- **例**: Hacker News、Reddit、個人ブログ、X投稿
- **特徴**: 多様な視点・議論・推測含む
- **信頼度**: 1-5

### 2.2 信頼度スコアリング

#### 評価基準（10段階）

| スコア | レベル | 基準 |
|--------|--------|------|
| 9-10 | Excellent | 公式発表・査読論文・政府機関 |
| 7-8 | High | 専門メディア・実名記者・実績ある企業 |
| 5-6 | Medium | 一般メディア・匿名記者・新興企業 |
| 3-4 | Low | 個人ブログ・SNS・未検証情報 |
| 1-2 | Very Low | 匿名投稿・噂・推測ベース |

#### 評価ファクター
- **透明性**: 著者・組織の明示 (25%)
- **専門性**: 分野での実績・専門知識 (25%)  
- **検証性**: 一次ソースへの言及・引用 (25%)
- **一貫性**: 過去の記事品質・訂正履歴 (25%)

### 2.3 ソース管理システム

#### ソースマスター管理
```sql
CREATE TABLE news_sources (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  source_type ENUM('primary', 'secondary', 'tertiary') NOT NULL,
  credibility_score INTEGER CHECK (credibility_score >= 1 AND credibility_score <= 10),
  verification_level ENUM('official', 'editorial', 'community') NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 初期ソースリスト（例）

**Primary Sources:**
- openai.com (score: 10, official)
- blog.google (score: 10, official)  
- github.com/releases (score: 9, official)
- developer.apple.com (score: 9, official)

**Secondary Sources:**  
- techcrunch.com (score: 8, editorial)
- theverge.com (score: 8, editorial)
- arstechnica.com (score: 7, editorial)
- infoq.com (score: 7, editorial)

**Tertiary Sources:**
- news.ycombinator.com (score: 5, community)
- reddit.com/r/programming (score: 4, community)
- medium.com (score: 3-6, community)

## 3. UI/UX仕様

### 3.1 記事表示

#### バッジシステム
```html
<!-- Primary Source -->
<span class="source-badge primary">
  🥇 Official
</span>

<!-- Secondary Source -->  
<span class="source-badge secondary">
  🥈 Editorial  
</span>

<!-- Tertiary Source -->
<span class="source-badge tertiary">
  🥉 Community
</span>
```

#### 信頼度表示
```html
<div class="credibility-score">
  <span class="score">8.5</span>
  <div class="score-bar">
    <div class="score-fill" style="width: 85%"></div>
  </div>
</div>
```

### 3.2 フィルタリング機能

#### ソース種別フィルタ
- [ ] Primary only
- [ ] Secondary only  
- [ ] Tertiary only
- [ ] All sources

#### 信頼度フィルタ
- スライダー UI（1-10の範囲選択）
- デフォルト: 5以上表示

### 3.3 ディテールビュー

#### 記事詳細ページ追加要素
```html
<div class="source-details">
  <h3>Source Information</h3>
  <div class="source-name">TechCrunch</div>
  <div class="source-type">🥈 Secondary (Editorial)</div>
  <div class="credibility-score">8.5/10</div>
  <div class="source-description">
    Technology news and startup coverage with professional editorial team.
  </div>
  <a href="#" class="source-profile">View Source Profile</a>
</div>
```

## 4. API仕様

### 4.1 新規エンドポイント

#### GET /api/v1/sources
ソースマスター一覧取得
```json
{
  "sources": [
    {
      "id": 1,
      "domain": "openai.com",
      "name": "OpenAI Blog", 
      "source_type": "primary",
      "credibility_score": 10,
      "verification_level": "official"
    }
  ]
}
```

#### GET /api/v1/sources/{id}
個別ソース詳細
```json
{
  "source": {
    "id": 1,
    "domain": "openai.com",
    "name": "OpenAI Blog",
    "source_type": "primary", 
    "credibility_score": 10,
    "verification_level": "official",
    "description": "Official blog of OpenAI...",
    "article_count": 45,
    "avg_nva_score": 8.2
  }
}
```

### 4.2 既存API拡張

#### GET /api/v1/contents 拡張
```json
{
  "contents": [
    {
      "slug": "gpt-4-turbo-release",
      "title": "GPT-4 Turbo Released",
      "source": {
        "domain": "openai.com",
        "name": "OpenAI Blog",
        "type": "primary",
        "credibility_score": 10,
        "badge": "🥇 Official"
      }
    }
  ]
}
```

#### クエリパラメータ追加
- `source_type`: primary|secondary|tertiary
- `min_credibility`: 1-10
- `max_credibility`: 1-10

## 5. データベース設計

### 5.1 新規テーブル

#### news_sources テーブル
```sql
CREATE TABLE news_sources (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  source_type source_type_enum NOT NULL,
  credibility_score INTEGER CHECK (credibility_score >= 1 AND credibility_score <= 10),
  verification_level verification_level_enum NOT NULL,
  description TEXT,
  tags TEXT[],
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE source_type_enum AS ENUM ('primary', 'secondary', 'tertiary');
CREATE TYPE verification_level_enum AS ENUM ('official', 'editorial', 'community');
```

### 5.2 既存テーブル修正

#### contents テーブル拡張
```sql
ALTER TABLE contents 
ADD COLUMN source_id INTEGER REFERENCES news_sources(id),
ADD COLUMN source_credibility_score INTEGER,
ADD COLUMN source_verification_note TEXT;
```

## 6. 実装計画

### 6.1 Phase 1: 基盤構築（Week 1）
- [ ] データベース設計・マイグレーション
- [ ] news_sources テーブル作成
- [ ] 初期ソースデータ投入（50-100ソース）
- [ ] 既存記事への source_id 紐付け

### 6.2 Phase 2: API開発（Week 2）  
- [ ] GET /api/v1/sources エンドポイント
- [ ] GET /api/v1/contents 拡張（source情報含む）
- [ ] フィルタリング機能（source_type, credibility）
- [ ] ソースマスター管理画面

### 6.3 Phase 3: UI実装（Week 3）
- [ ] バッジシステム実装
- [ ] 信頼度スコア表示
- [ ] フィルタリングUI
- [ ] ソース詳細ページ

### 6.4 Phase 4: 運用最適化（Week 4）
- [ ] 自動ソース検出・登録
- [ ] 信頼度スコア自動更新
- [ ] A/Bテスト・効果測定
- [ ] ユーザーフィードバック収集

## 7. 成功指標（KPI）

### 7.1 利用指標
- ソースフィルタ利用率: >30%
- バッジクリック率: >15%  
- 一次ソース記事のエンゲージメント向上: >20%

### 7.2 品質指標
- ソース分類精度: >95%
- 信頼度スコア一貫性: ±0.5以内
- ユーザー満足度: >4.0/5.0

### 7.3 ビジネス指標
- 記事滞在時間向上: >25%
- リピートユーザー増加: >15%
- 機能満足度: >80%

## 8. リスク・考慮事項

### 8.1 技術リスク
- **ソース分類の主観性**: 明確な基準とレビューシステム必要
- **スケーラビリティ**: 新規ソース追加時の運用負荷
- **パフォーマンス**: API レスポンス時間への影響

### 8.2 運用リスク  
- **ソース評価の公平性**: 偏見や主観を排除する仕組み
- **継続的メンテナンス**: ソース信頼度の定期見直し
- **ユーザー教育**: 機能理解と適切な利用促進

### 8.3 対策
- 複数人レビュー体制
- 自動化可能な部分の特定・実装
- ユーザーフィードバックループ構築

## 9. 参考資料

- AllSides.com: Media Bias Rating System
- MediaBiasFactCheck: Fact-based News Sourcing
- Reuters Institute: Digital News Report 2023
- Pew Research: News Source Credibility Study

---

**作成日**: 2026-02-13  
**作成者**: tifa  
**承認者**: けいた  
**次回レビュー**: 実装完了時