# ソース資料: Kimi K2.5 + Kimi Code

調査日: 2026-02-03

## X (Twitter)
- 検索クエリ: `"Kimi K2.5"` / `"Moonshot AI"`
- Michael Spencer (@aisupremacy): 「Breaking News: Moonshot AI just dropped Kimi-2.5 about 3 hours ago. China is moving so fast in agentic AI and reasoning models.」 [Substack note](https://substack.com/@aisupremacy/note/c-205912402)
- 多数のAI系インフルエンサーが言及（具体的なX検索はrate limit制約により定量データ未取得）

## Reddit
- r/LocalLLaMA: **「Introducing Kimi K2.5, Open-Source Visual Agentic Intelligence」** — **491 upvotes, 110 comments** [URL](https://www.reddit.com/r/LocalLLaMA/comments/1qo595n/)
- r/LocalLLaMA: **「Run Kimi K2.5 Locally」** — **245 upvotes, 51 comments** [URL](https://www.reddit.com/r/LocalLLaMA/comments/1qpfse6/)
- r/LocalLLaMA: 「Kimi K2.5 is the best open model for coding」 [URL](https://www.reddit.com/r/LocalLLaMA/comments/1qp87tk/)
- r/LocalLLaMA: 「Kimi K2.5 Agent Swarm」 — 「I'm blown away by Kimi K2.5 Agent Swarm. it's giving me serious Grok Heavy vibes but waaayyy cheaper.」 [URL](https://www.reddit.com/r/LocalLLaMA/comments/1qoscar/)
- r/LocalLLaMA: 「[LEAKED] Kimi K2.5's full system prompt + tools (released <24h ago)」 [URL](https://www.reddit.com/r/LocalLLaMA/comments/1qoml1n/)
- r/opencodeCLI: 「I tried Kimi K2.5 with OpenCode it's really good」 — 「It actually solved a problem I could not get Opus 4.5 to solve」 [URL](https://www.reddit.com/r/opencodeCLI/comments/1qr6u36/)

## Hacker News
- **「Kimi Released Kimi K2.5, Open-Source Visual SOTA-Agentic Model」** [URL](https://news.ycombinator.com/item?id=46775961)
  - 活発な議論（量子化、ローカル実行、ライセンスについて）
  - 「One. Trillion. Even on native int4 that's… half a terabyte of vram?!」
  - 反論: 「The model absolutely can be run at home. There even is a big community around running large models locally」
  - MoE構造（32B active parameters）によりローカル実行は現実的との議論

## GitHub
- **MoonshotAI/Kimi-K2.5**: ⭐ **515スター**, 41フォーク [URL](https://github.com/MoonshotAI/Kimi-K2.5)
- Hugging Face: moonshotai/Kimi-K2.5 公開中
- Kimi Code: Apache 2.0ライセンスのコーディングエージェント（CLI, VS Code/Cursor/Zed対応）

## テックメディア記事
- **ZDNET**: 「Move over, Claude: Moonshot's new AI model lets you vibe-code from a single video upload」 [URL](https://www.zdnet.com/article/moonshot-kimi-k2-5-model/)
- **Latent Space (AI News)**: 「Moonshot Kimi K2.5 - Beats Sonnet 4.5 at half the cost, SOTA Open Model」 [URL](https://www.latent.space/p/ainews-moonshot-kimi-k25-beats-sonnet)
- **byteiota**: 「Kimi K2.5: 100-Agent Swarms Need $500k GPUs to Run」 [URL](https://byteiota.com/kimi-k2-5-100-agent-swarms-need-500k-gpus-to-run/)
- **Ground News**: 「How Moonshot's Kimi K2.5 Helps AI Builders Spin up Agent Swarms Easier than Ever」 [URL](https://ground.news/article/chinas-moonshot-releases-a-new-open-source-model-kimi-k25-and-a-coding-agent_10fd3a)
- **Wikipedia**: Kimi (chatbot) と Moonshot AI のWikipedia記事が更新済み
- YouTube: 「Why is Everyone OBSESSED With The New Kimi K2.5 AI Model」 (2日前公開)

## 公式発表
- [公式ページ](https://www.kimi.com/ai-models/kimi-k2-5)
- 1兆パラメータ MoE（アクティブ32B）
- MIT ライセンス（月間1億MAU or $20M月間収益超でKimi K2.5の表示義務）
- 評価額 $4.8B、シリーズC $500M調達済み
- HLE-Full 50.2%、BrowseComp 74.9%
- 15兆テキスト+ビジュアルトークンで事前学習
