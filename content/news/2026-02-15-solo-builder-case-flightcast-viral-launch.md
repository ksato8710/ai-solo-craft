---
title: "24時間で数百万インプレッション — Rox CodesがFlightcastをバイラルローンチさせた方法"
slug: "solo-builder-case-flightcast-viral-launch"
date: "2026-02-15"
contentType: "news"
tags: ["case-study", "marketing", "partnership", "viral"]
description: "複数の失敗を経て5桁MRRでExitしたRox Codesが、Steven BartlettとのパートナーシップでポッドキャストホスティングツールFlightcastをローンチ。24時間で数百人の有料顧客を獲得した実話。"
readTime: 10
image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=420&fit=crop"
relatedProducts: []
source:
  name: "Indie Hackers"
  url: "https://www.indiehackers.com/post/tech/getting-millions-of-impressions-and-hundreds-of-paying-customers-in-24-hours-SdR5OmCKzyviysmrVbdn"
  type: "primary"
  credibility_score: 9
---

# 24時間で数百万インプレッション

> この記事は [Indie Hackers](https://www.indiehackers.com/post/tech/getting-millions-of-impressions-and-hundreds-of-paying-customers-in-24-hours-SdR5OmCKzyviysmrVbdn) での Rox Codes のインタビューに基づいています。

**Rox Codes** は5年以上クリエイター向けツールを開発してきた。レストランスタートアップで失敗、Twitchツールで失敗、そしてThumbnailTestで5桁MRRを達成しExitした。

その後、The Diary of a CEO の **Steven Bartlett** とパートナーを組み、ポッドキャストホスティングツール [Flightcast](https://flightcast.com/) を開発。2025年10月のローンチでは、**24時間で数百万インプレッション、数百人の有料顧客**を獲得した。

## 失敗の連続から成功へ

Rox Codesのキャリアは失敗の連続だった。

1. **レストランスタートアップ** — 失敗
2. **Twitchストリーマー向けツール** — 失敗
3. **ThumbnailTest**（YouTuberのサムネイルA/Bテスト）— 5桁MRR達成、2024年初頭にExit

> 「全てを売り払ってタイに移住し、数年間デジタルノマドをやった。その間、毎日8時間ライブコーディングするTwitchストリーマーになった」

ThumbnailTestの開発中にMrBeastチームに発見され、彼らのツール開発を手伝うことに。そこでの経験がクリエイター市場への理解を深めた。

## Steven Bartlettとのパートナーシップ

ThumbnailTest売却後、The Diary of a CEOのSteven Bartlettから連絡が来た。

> 「一緒に何か作ろう」

数ヶ月かけてアイデアを練り、**ビデオファーストのポッドキャストホスティング**にたどり着いた。

### なぜポッドキャストホスティングか

> 「クリエイター向けツールは多いが、本当に違うことをやっているものは少ない。AIだらけだ。私はシンプルなビジネスを作りたかった——コアにはAIを使わず、機能の1つ2つに使うだけ」

ポッドキャストホスティングを選んだ理由：

- 大きなファイルを何度もアップロード
- 分析が複数プラットフォームに散らばっている
- 非常に面倒な問題 = 解決しがいがある

## ローンチ戦略：事前配置された配信

過去の経験から、Rox Codesは配信の重要性を痛感していた。

> 「配信との戦いを経て、私は適切なオーディエンスとマインドセットを持つパートナーが必要だと理解した。このビジネスでは、Steveとパートナーを組むことで配信を事前配置できた」

### ローンチ当日

1. **Flightチーム全員がLinkedInで同日投稿** — 彼らのネットワークはポッドキャスト関係者だらけ
2. **ポッドキャストニュースアウトレットでPR**
3. **結果:** 数百万インプレッション、数百人の有料顧客（24時間以内）

> 「数年かけた『一夜の成功』のような日だった」

### ローンチ後の成長

- ポッドキャスターが友人に紹介
- エージェンシーが管理する番組をどんどん追加
- 計画中: アフィリエイトプログラム、ポッドキャスト出演、番組内広告のディスカウント

## 技術スタック

| 層 | 技術 |
|----|------|
| Frontend | Next.js |
| Edge/CDN | Cloudflare |
| Media Backend | Go |
| Servers | OVH |
| Database | Planetscale |

開発には多くのイテレーションが必要だった。

> 「5つの投稿を同時にできるのは素晴らしく聞こえるが、構築は本当に大変だ」

やり直せるなら、v1.0を1つの素晴らしい機能（おそらくアナリティクス）に絞り、追加の複雑さを加える前に出荷していた。

## CEOとして学んだこと

今回、Rox CodesはCEOの役割を担った。

> 「もうエンジニアだけではいられない。12時間コードに没頭できなくなった」

シード資金を得て、自分より優秀な人を採用。しかし、チーム管理は新しい挑戦だった。

> 「正直、やり直すなら、基盤ができるまでチームを雇うのを遅らせただろう」

## ソロビルダーへのアドバイス

### クリエイターとパートナーを組む

> 「適切な人を見つければ、人生で最高の決断になる」

### 「誰よりも気にかける」戦略

1. まともな収入はあるが、十分に注目されていない人々を見つける
2. 彼らが今使っているものを調べる
3. **1つの機能だけを最高にする**

> 「ThumbnailTestはTubeBuddyから直接取った。何ヶ月もかけて私のA/Bテスターを5倍良くした。TubeBuddyを使っている人が乗り換える明確で簡単な選択肢にした」

小さな1つの問題を、他の誰よりも気にかける。それだけでいい。

---

**参考リンク**

- **一次ソース:** [Getting millions of impressions and hundreds of paying customers in 24 hours - Indie Hackers](https://www.indiehackers.com/post/tech/getting-millions-of-impressions-and-hundreds-of-paying-customers-in-24-hours-SdR5OmCKzyviysmrVbdn)
- **公式サイト:** [Flightcast](https://flightcast.com/)
- **X:** [@roxcodes](https://x.com/roxcodes)
- **ポッドキャスト:** [Spotify Episode](https://open.spotify.com/episode/30HLXZoS3TdG4qInXeZPCv)
