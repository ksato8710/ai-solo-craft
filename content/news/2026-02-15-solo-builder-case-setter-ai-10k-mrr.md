---
title: "12スタートアップ・チャレンジで見つけた正解 — Josef BüttgenがSetter AIで$10K MRRを達成するまで"
slug: "solo-builder-case-setter-ai-10k-mrr"
date: "2026-02-15"
contentType: "news"
tags: ["case-study", "saas", "ai", "bootstrapping"]
description: "最初のプロダクトが失敗し資金が尽きかけたJosef Büttgenが、12スタートアップ・チャレンジを経てSetter AIで$10K MRRを達成した実話。"
readTime: 10
image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=420&fit=crop"
relatedProducts: []
source:
  name: "Indie Hackers"
  url: "https://www.indiehackers.com/post/tech/from-desperation-and-dwindling-runway-to-10k-mrr-VRQprGga5zF3UFDqiCqw"
  type: "primary"
  credibility_score: 9
---

# 12スタートアップ・チャレンジで見つけた正解

> この記事は [Indie Hackers](https://www.indiehackers.com/post/tech/from-desperation-and-dwindling-runway-to-10k-mrr-VRQprGga5zF3UFDqiCqw) での Josef Büttgen のインタビューに基づいています。

**Josef Büttgen** は最初のプロダクトが失敗し、残り数ヶ月の資金しかない状態で「12スタートアップ・イン・12ヶ月」チャレンジを始めた。3ヶ月目に見つけたアイデアが [Setter AI](https://www.trysetter.com/) となり、1年半後には **$10,000 MRR** を達成した。

## 背景：フリーランスから起業へ

Josefは13歳で独学プログラミングを始め、大学でCSを学んだ後、企業での経験を経てフリーランスに。十分な資金を貯めてから起業に専念するため、東南アジアでデジタルノマドをしながら準備を進めた。

最初のプロダクトは彼女のビジネスの業務効率化ツール。しかし、彼女のビジネス以外ではトラクションを得られず、1年後に撤退を決意した。

## 転機：12スタートアップ・チャレンジ

資金が尽きかけていた彼は、旅先で出会った成功者たちが実践していた「12スタートアップ・イン・12ヶ月」チャレンジを開始。

> 「初めて本当に前進している感覚を得た。必要なことだけをやり、素早く動けた」

3ヶ月目、友人がアイデアを持ちかけてきた。その友人は既にランディングページを作り、**プロダクトなしでデモコールの予約を取っていた**。この検証結果と、Josef自身のセールスソフトウェアへの関心が重なり、2人で [Setter AI](https://www.trysetter.com/) を共同創業した。

## Setter AI とは

**Setter AI** は、B2B SaaSプラットフォーム。AIがリードの選別とフォローアップを自動化し、人間より速くアポイントメントを設定する。

## 2週間でMVPを出荷・販売

Josefは過去の失敗から学んでいた。

> 「何ヶ月も開発してトラクションが出ない失敗は繰り返したくなかった。だからプロダクトは可能な限りシンプルに保ち、問題を解決できることだけを証明したかった」

当初はOpenAI、ElevenLabs、TwilioでAI音声アシスタントを構築しようとしたが、数日で難易度を実感。方針を転換し、既存APIを活用した。結果、**2週間以内に最初のプロトタイプを出荷・販売**できた。

### 技術スタック

| 層 | 技術 |
|----|------|
| Frontend | SvelteKit |
| Backend | Supabase |
| UI | DaisyUI |
| Auth | Clerk |
| Hosting | Netlify Functions |

## ビジネスは完璧じゃなくていい

エンジニアとして「バグゼロ」「100%の品質」を目指す習慣があったJosefは、ビジネスでは違うと学んだ。

> 「ビジネスはソフトウェアと違う。拒否されること、顧客が離れること、完璧にいかないことを受け入れなければならない」

一方で、特定の人々に価値を提供できるようになると、自分自身とプロダクトへの自信が生まれてきたという。

## 成長戦略：オーガニックSEOとメールマーケティング

広告やコールドメールも試したが、最も効果があったのは **オーガニックSEO** と **メールマーケティング** だった。

### SEO

- リスト記事、統計ページ、比較・代替ページが特に効果的
- 「AI Appointment Setter」というキーワードで長期的にポジションを確立

### メールリスト

- サインアップ時にニュースレター登録を促進
- 無料ツールをリードマグネットとして活用
- 高単価顧客が1年後に戻ってくることも

## ハイタッチ顧客が収益の柱

ビジネスモデルは、限定的な無料枠を持つサブスクリプション型。料金はシステムで処理するリード数に基づく。

収益成長の大部分は **ハイタッチ顧客** から。共同創業者がセールスコールを担当し、初期セットアップパッケージも販売。残りはセルフサーブ顧客から。

## MRR推移

| 時点 | MRR |
|------|-----|
| 創業時 | $0 |
| 1年後 | $10,000 |

## Josefからのアドバイス

1. **適切な仲間を見つける** — インディーハッカーの仲間やメンター
2. **考えるな** — ゼロの状態で考えることはない。まずノイズを作れ
3. **早い段階で本気でコミットする**
4. **毎日何かを出荷する** — 出荷が全て
5. **作る前に売る** — 必ず検証してから開発

## 学び：ソロビルダーへの示唆

Josefの事例から学べること：

- **12スタートアップ・チャレンジ** は強制的に「考えすぎ」を防ぐ
- **プロダクトなしで検証** できる（LPとデモコールだけで）
- **2週間でMVP** は現実的な目標
- **完璧を捨てる** ことでスピードが出る

---

**参考リンク**

- **一次ソース:** [From desperation and dwindling runway to $10k MRR - Indie Hackers](https://www.indiehackers.com/post/tech/from-desperation-and-dwindling-runway-to-10k-mrr-VRQprGga5zF3UFDqiCqw)
- **公式サイト:** [Setter AI](https://www.trysetter.com/)
- **X:** [@josefbuettgen](https://x.com/josefbuettgen)
- **YouTube:** [Josef Büttgen](https://www.youtube.com/@josefbuettgen)
