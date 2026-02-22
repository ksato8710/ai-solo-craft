const fs = require('fs');
const path = require('path');

// プロダクト情報データベース（主要なもの）
const productInfo = {
  'devin': {
    company: 'Cognition AI',
    country: '米国',
    pricing: '月額$500〜（エンタープライズ向け）',
    category: '自律型AIエンジニア',
    features: [
      { name: 'フルスタック開発', desc: 'フロントエンドからバックエンド、インフラまで一貫して開発' },
      { name: '自律的問題解決', desc: 'エラーを自分で検知・修正し、テストまで完了' },
      { name: 'Slack/GitHub統合', desc: 'SlackでタスクをリクエストしGitHubでPR作成' }
    ],
    limitations: ['月額が高額で個人利用には向かない', '複雑なドメイン知識が必要なタスクは精度が落ちる', '現時点では招待制・ウェイトリスト'],
    url: 'https://devin.ai/'
  },
  'stable-diffusion': {
    company: 'Stability AI',
    country: '英国',
    pricing: '無料（オープンソース）/ Stability AI API従量課金',
    category: '画像生成AI',
    features: [
      { name: 'ローカル実行', desc: 'クラウド不要で自分のPCで生成可能。プライバシー確保' },
      { name: 'LoRA/ファインチューニング', desc: 'カスタムモデルを作成して特定スタイルを学習' },
      { name: 'ControlNet', desc: 'ポーズ・構図を制御して狙った画像を生成' }
    ],
    limitations: ['ローカル実行には高性能GPU（VRAM 8GB+）が必要', 'モデル管理・環境構築の学習コストがある', '商用利用時はライセンス確認が必要'],
    url: 'https://stability.ai/'
  },
  'chatgpt': {
    company: 'OpenAI',
    country: '米国',
    pricing: '無料版 / Plus $20/月 / Team $25/月',
    category: '対話型AI',
    features: [
      { name: 'GPT-4o', desc: '最新のマルチモーダルモデルで画像・音声も理解' },
      { name: 'カスタムGPTs', desc: '特定用途に特化したカスタムアシスタントを作成' },
      { name: 'Advanced Data Analysis', desc: 'コード実行・データ分析・グラフ生成' }
    ],
    limitations: ['無料版は利用回数制限あり', 'リアルタイム情報は検索機能経由のみ', '長文の文脈保持に限界がある'],
    url: 'https://chat.openai.com/'
  },
  'openai': {
    company: 'OpenAI',
    country: '米国',
    pricing: 'API従量課金（GPT-4o: $5/1M input tokens）',
    category: 'AI APIプラットフォーム',
    features: [
      { name: 'GPTシリーズ', desc: 'GPT-4o、GPT-4 Turbo、GPT-3.5など複数モデル' },
      { name: 'Assistants API', desc: 'ステートフルなAIアシスタントを構築' },
      { name: 'DALL-E / Whisper', desc: '画像生成・音声認識APIも提供' }
    ],
    limitations: ['従量課金で大量利用時はコストが膨らむ', 'Rate limitの管理が必要', 'モデル更新で挙動が変わることがある'],
    url: 'https://platform.openai.com/'
  },
  'notion-ai': {
    company: 'Notion Labs',
    country: '米国',
    pricing: 'Notion Plus/Business + AI $10/月',
    category: 'ドキュメントAI',
    features: [
      { name: '文章生成・編集', desc: '要約、翻訳、トーン変更、続き書きなど' },
      { name: 'Q&A', desc: 'ワークスペース内の情報に基づいて質問に回答' },
      { name: 'オートフィル', desc: 'データベースプロパティを自動入力' }
    ],
    limitations: ['Notion契約が前提（単独利用不可）', 'ワークスペース外の情報は参照できない', '日本語の精度は英語より劣る場合あり'],
    url: 'https://www.notion.so/product/ai'
  },
  'github-copilot': {
    company: 'GitHub (Microsoft)',
    country: '米国',
    pricing: '個人 $10/月 / Business $19/月',
    category: 'AIコード補完',
    features: [
      { name: 'インライン補完', desc: 'コメントや文脈から次のコードを予測・提案' },
      { name: 'Copilot Chat', desc: 'エディタ内でコードについて質問・相談' },
      { name: 'マルチファイル理解', desc: 'プロジェクト全体の文脈を考慮した提案' }
    ],
    limitations: ['提案コードの品質は常にレビューが必要', '機密コードがクラウドに送信される点に注意', 'ライセンス的にグレーなコード生成の可能性'],
    url: 'https://github.com/features/copilot'
  },
  'cursor': {
    company: 'Cursor',
    country: '米国',
    pricing: '無料版 / Pro $20/月',
    category: 'AI統合エディタ',
    features: [
      { name: 'Composer', desc: 'マルチファイル編集を自然言語で指示' },
      { name: 'インライン編集', desc: 'コード選択→Cmd+Kで即座に修正' },
      { name: 'コードベース理解', desc: 'プロジェクト全体を把握した上での提案' }
    ],
    limitations: ['VS Codeの拡張機能との互換性に制限がある場合あり', 'Pro版でないとモデル利用に制限', '大規模プロジェクトではインデックス作成に時間がかかる'],
    url: 'https://cursor.com/'
  },
  'replit-ai': {
    company: 'Replit',
    country: '米国',
    pricing: '無料版 / Core $25/月',
    category: 'AI統合開発環境',
    features: [
      { name: 'Ghostwriter', desc: 'コード補完・生成・説明をリアルタイムで' },
      { name: 'Agent', desc: '自然言語でアプリ開発を指示' },
      { name: 'ブラウザIDE', desc: 'セットアップ不要で即座に開発開始' }
    ],
    limitations: ['無料版はリソース制限が厳しい', '本格的なプロジェクトには機能が不足する場合あり', '実行環境がクラウドのためレイテンシがある'],
    url: 'https://replit.com/'
  },
  'tabnine': {
    company: 'Tabnine',
    country: 'イスラエル',
    pricing: '無料版 / Pro $12/月',
    category: 'AIコード補完',
    features: [
      { name: 'プライベートモデル', desc: '自社コードベースでファインチューニング可能' },
      { name: 'ローカル実行', desc: 'コードをクラウドに送信せずローカルで補完' },
      { name: '全言語対応', desc: '30+のプログラミング言語をサポート' }
    ],
    limitations: ['Copilotと比べると補完精度がやや劣る場合あり', 'プライベートモデルはエンタープライズプラン必要', 'チャット機能はCopilotほど洗練されていない'],
    url: 'https://www.tabnine.com/'
  },
  'phind': {
    company: 'Phind',
    country: '米国',
    pricing: '無料版 / Pro $20/月',
    category: 'AI検索エンジン',
    features: [
      { name: '開発者特化検索', desc: 'プログラミング質問に最適化された回答' },
      { name: 'コード生成', desc: '検索結果からそのままコードを生成' },
      { name: 'ソース明示', desc: '回答の根拠となるソースを表示' }
    ],
    limitations: ['一般的な検索にはPerplexityの方が向いている', '日本語対応は限定的', 'Pro版でないとモデル選択に制限'],
    url: 'https://www.phind.com/'
  },
  'you-com': {
    company: 'You.com',
    country: '米国',
    pricing: '無料版 / Pro $20/月',
    category: 'AI検索エンジン',
    features: [
      { name: 'AIモード', desc: '質問に対して直接回答を生成' },
      { name: 'マルチモデル', desc: 'GPT-4、Claude等の複数モデルを選択可能' },
      { name: 'プライバシー重視', desc: '検索履歴を保存しないオプション' }
    ],
    limitations: ['Perplexityほどの知名度・ユーザー数がない', '回答品質にばらつきがある', '日本語対応は発展途上'],
    url: 'https://you.com/'
  },
  'kagi': {
    company: 'Kagi',
    country: '米国',
    pricing: '$5/月〜（検索回数制限あり）',
    category: 'プレミアム検索エンジン',
    features: [
      { name: '広告なし', desc: '完全に広告フリーの検索体験' },
      { name: 'カスタマイズ', desc: '特定サイトの優先/ブロック設定' },
      { name: 'AI要約', desc: '検索結果をAIが要約' }
    ],
    limitations: ['有料のみ（無料版なし）', '日本語検索結果は英語より劣る', 'ニッチな検索には弱い場合あり'],
    url: 'https://kagi.com/'
  },
  'raycast-ai': {
    company: 'Raycast',
    country: 'チェコ',
    pricing: 'Raycast Pro $10/月',
    category: 'AIランチャー',
    features: [
      { name: 'Quick AI', desc: 'ショートカットで即座にAI呼び出し' },
      { name: 'AI Commands', desc: '定型タスクをワンクリックで実行' },
      { name: '全体統合', desc: 'Raycastの他機能とシームレスに連携' }
    ],
    limitations: ['macOS専用', 'Raycast Pro契約が必要', 'AI機能単体では使えない'],
    url: 'https://www.raycast.com/ai'
  },
  'warp': {
    company: 'Warp',
    country: '米国',
    pricing: '無料版 / Team $22/月',
    category: 'AIターミナル',
    features: [
      { name: 'Warp AI', desc: '自然言語でコマンドを生成・説明' },
      { name: 'Blocks', desc: 'コマンド出力をブロック単位で管理' },
      { name: 'ワークフロー', desc: '繰り返すコマンドをワークフロー化' }
    ],
    limitations: ['macOS/Linux専用（Windows未対応）', 'アカウント登録必須', '従来のターミナルに慣れていると学習コストあり'],
    url: 'https://www.warp.dev/'
  },
  'sora': {
    company: 'OpenAI',
    country: '米国',
    pricing: 'ChatGPT Plus/Pro に含まれる',
    category: 'AI動画生成',
    features: [
      { name: 'テキストから動画', desc: 'プロンプトから最大1分の高品質動画を生成' },
      { name: '物理シミュレーション', desc: '現実世界の物理法則を理解した動画生成' },
      { name: 'スタイル制御', desc: '様々な映像スタイル・カメラワークに対応' }
    ],
    limitations: ['生成時間が長い（数分〜）', '人物の手・指の描写は苦手', '商用利用の条件は要確認'],
    url: 'https://openai.com/sora'
  },
  'pika': {
    company: 'Pika Labs',
    country: '米国',
    pricing: '無料版 / Standard $10/月',
    category: 'AI動画生成',
    features: [
      { name: 'テキスト/画像から動画', desc: 'プロンプトや画像から動画を生成' },
      { name: 'リップシンク', desc: '音声に合わせた口の動きを自動生成' },
      { name: 'エフェクト', desc: '爆発・変形などの特殊効果を追加' }
    ],
    limitations: ['生成動画は3-4秒が基本', '高解像度出力には上位プランが必要', '複雑なシーンは意図通りにならないことあり'],
    url: 'https://pika.art/'
  },
  'heygen': {
    company: 'HeyGen',
    country: '米国',
    pricing: '無料版 / Creator $29/月',
    category: 'AIアバター動画',
    features: [
      { name: 'AIアバター', desc: '100+のリアルなAIアバターから選択' },
      { name: '多言語対応', desc: '40+言語での音声生成・リップシンク' },
      { name: 'カスタムアバター', desc: '自分の顔でアバターを作成' }
    ],
    limitations: ['商用利用にはビジネスプラン推奨', 'カスタムアバターは追加料金', 'アバターの表情パターンに限りがある'],
    url: 'https://www.heygen.com/'
  },
  'synthesia': {
    company: 'Synthesia',
    country: '英国',
    pricing: 'Starter $22/月',
    category: 'AIアバター動画',
    features: [
      { name: 'AIアバター', desc: '160+のストックアバターから選択' },
      { name: 'カスタムアバター', desc: '自分や社員のアバターを作成' },
      { name: '多言語', desc: '130+言語・アクセントに対応' }
    ],
    limitations: ['エンタープライズ向け価格設定', '個人クリエイターには割高', 'リアルタイム生成は不可'],
    url: 'https://www.synthesia.io/'
  },
  'kling-ai': {
    company: 'Kuaishou',
    country: '中国',
    pricing: '無料版あり / Pro版は要確認',
    category: 'AI動画生成',
    features: [
      { name: '長尺生成', desc: '最大2分の動画を一度に生成' },
      { name: '高画質', desc: '1080p対応の高品質出力' },
      { name: 'モーション制御', desc: '細かいカメラワーク・動きの指定' }
    ],
    limitations: ['中国発のため利用規約・データ取り扱いに注意', '日本からのアクセスが不安定な場合あり', '英語/中国語以外のプロンプトは精度低下'],
    url: 'https://klingai.com/'
  },
  'luma-ai': {
    company: 'Luma AI',
    country: '米国',
    pricing: '無料版 / Pro $29.99/月',
    category: 'AI動画・3D生成',
    features: [
      { name: 'Dream Machine', desc: 'テキストから高品質動画を生成' },
      { name: '3Dキャプチャ', desc: 'スマホ動画から3Dモデルを生成' },
      { name: 'NeRF', desc: '写真から3Dシーンを再構築' }
    ],
    limitations: ['3Dキャプチャには対応デバイスが必要', '動画生成は競合と比べると後発', '無料版の生成数制限が厳しい'],
    url: 'https://lumalabs.ai/'
  },
  'dall-e-3': {
    company: 'OpenAI',
    country: '米国',
    pricing: 'ChatGPT Plus/API従量課金',
    category: 'AI画像生成',
    features: [
      { name: 'テキスト理解', desc: '複雑なプロンプトも正確に理解' },
      { name: '文字生成', desc: '画像内のテキストを正確に描画' },
      { name: 'ChatGPT統合', desc: '対話形式で画像を生成・修正' }
    ],
    limitations: ['スタイルの一貫性を保つのが難しい', '特定の人物・著作物は生成拒否', '1枚ずつの生成で大量生成には不向き'],
    url: 'https://openai.com/dall-e-3'
  },
  'ideogram': {
    company: 'Ideogram',
    country: '米国',
    pricing: '無料版 / Basic $8/月',
    category: 'AI画像生成',
    features: [
      { name: 'テキスト描画', desc: '画像内の文字を正確にレンダリング' },
      { name: 'ロゴ生成', desc: 'ロゴ・タイポグラフィに強い' },
      { name: 'スタイル多様性', desc: 'リアルからイラストまで幅広く対応' }
    ],
    limitations: ['生成枚数に制限あり（無料版）', 'プロンプトの書き方にコツが必要', '日本語テキストの生成は不安定'],
    url: 'https://ideogram.ai/'
  },
  'leonardo-ai': {
    company: 'Leonardo.ai',
    country: 'オーストラリア',
    pricing: '無料版 / Apprentice $12/月',
    category: 'AI画像生成',
    features: [
      { name: 'ファインチューンモデル', desc: 'ゲーム・アニメ等特化モデルを選択可能' },
      { name: 'AI Canvas', desc: 'インペイント・アウトペイントで編集' },
      { name: 'モーション', desc: '画像から短いアニメーションを生成' }
    ],
    limitations: ['無料版のクレジット制限が厳しい', 'モデルが多すぎて選択に迷う', '商用利用は有料プラン必須'],
    url: 'https://leonardo.ai/'
  },
  'playground-ai': {
    company: 'Playground',
    country: '米国',
    pricing: '無料版 / Pro $15/月',
    category: 'AI画像生成',
    features: [
      { name: '大量生成', desc: '無料でも1日500枚以上生成可能' },
      { name: 'キャンバス編集', desc: 'Photoshopライクな編集機能' },
      { name: 'コミュニティ', desc: '他ユーザーの作品・プロンプトを参照' }
    ],
    limitations: ['最新モデルへの対応が遅れがち', 'UIが複雑で初心者には取っつきにくい', '商用利用の条件は要確認'],
    url: 'https://playground.com/'
  },
  'adobe-firefly': {
    company: 'Adobe',
    country: '米国',
    pricing: 'Creative Cloud付属 / 単体$4.99/月',
    category: 'AI画像生成',
    features: [
      { name: '商用安全', desc: 'Adobe Stockでトレーニング、著作権クリア' },
      { name: 'CC統合', desc: 'Photoshop、Illustratorから直接利用' },
      { name: 'スタイル参照', desc: '参照画像のスタイルを適用' }
    ],
    limitations: ['生成品質はMidjourney/DALL-E 3に劣る場合あり', '単体利用より他Adobe製品と組み合わせが前提', 'クレジット制の消費が分かりにくい'],
    url: 'https://www.adobe.com/products/firefly.html'
  },
  'copy-ai': {
    company: 'Copy.ai',
    country: '米国',
    pricing: '無料版 / Pro $49/月',
    category: 'AIライティング',
    features: [
      { name: 'テンプレート', desc: '90+のマーケティングテンプレート' },
      { name: 'ブランドボイス', desc: 'ブランドのトーン・スタイルを学習' },
      { name: 'ワークフロー', desc: '複数ステップの自動化' }
    ],
    limitations: ['日本語対応は限定的', 'Pro版の価格が高め', 'テンプレート依存になりやすい'],
    url: 'https://www.copy.ai/'
  },
  'writesonic': {
    company: 'Writesonic',
    country: 'インド',
    pricing: '無料版 / Small Team $13/月',
    category: 'AIライティング',
    features: [
      { name: 'Chatsonic', desc: 'リアルタイム情報を含むチャットAI' },
      { name: '記事生成', desc: 'SEO最適化されたブログ記事を生成' },
      { name: 'Botsonic', desc: 'ノーコードでチャットボット作成' }
    ],
    limitations: ['生成品質にばらつきがある', 'UIが複雑で機能が多すぎる', '日本語は英語より精度が落ちる'],
    url: 'https://writesonic.com/'
  },
  'sudowrite': {
    company: 'Sudowrite',
    country: '米国',
    pricing: '$10/月〜',
    category: 'AI小説執筆',
    features: [
      { name: 'Story Engine', desc: '長編小説の構成・執筆を支援' },
      { name: 'Describe', desc: '五感を使った描写を自動生成' },
      { name: 'Rewrite', desc: '文章のトーン・スタイルを変換' }
    ],
    limitations: ['小説・フィクション特化で他用途には不向き', '日本語対応は限定的', '月額クレジット制で大量執筆はコスト増'],
    url: 'https://www.sudowrite.com/'
  },
  'rytr': {
    company: 'Rytr',
    country: 'インド',
    pricing: '無料版 / Unlimited $9/月',
    category: 'AIライティング',
    features: [
      { name: '40+ユースケース', desc: 'ブログ、広告、メール等多目的対応' },
      { name: '30+言語', desc: '日本語を含む多言語対応' },
      { name: 'SEOアナライザー', desc: 'キーワード最適化を支援' }
    ],
    limitations: ['長文生成の品質は他ツールに劣る', '高度なカスタマイズは不可', 'テンプレートが汎用的すぎる'],
    url: 'https://rytr.me/'
  },
  'murf-ai': {
    company: 'Murf AI',
    country: 'インド',
    pricing: '無料版 / Creator $29/月',
    category: 'AI音声生成',
    features: [
      { name: '120+音声', desc: '20+言語のリアルな音声' },
      { name: 'ボイスクローン', desc: '自分の声をクローン（エンタープライズ）' },
      { name: 'ピッチ調整', desc: '声のトーン・速度を細かく制御' }
    ],
    limitations: ['ボイスクローンは上位プラン限定', '日本語音声の選択肢が少ない', '感情表現のパターンに限りがある'],
    url: 'https://murf.ai/'
  },
  'descript': {
    company: 'Descript',
    country: '米国',
    pricing: '無料版 / Creator $15/月',
    category: '音声・動画編集AI',
    features: [
      { name: 'テキストで編集', desc: '文字起こしを編集すると音声/動画も編集' },
      { name: 'Overdub', desc: '自分の声をクローンしてテキスト読み上げ' },
      { name: 'Studio Sound', desc: 'ノイズ除去・音質改善をワンクリック' }
    ],
    limitations: ['日本語の文字起こし精度は英語より劣る', 'Overdubは英語のみ対応', '高度な編集には従来ツールが必要'],
    url: 'https://www.descript.com/'
  },
  'assemblyai': {
    company: 'AssemblyAI',
    country: '米国',
    pricing: '従量課金（$0.00025/秒〜）',
    category: '音声認識API',
    features: [
      { name: '高精度文字起こし', desc: '業界最高水準の認識精度' },
      { name: 'LeMUR', desc: '音声に対してLLMで質問・要約' },
      { name: 'リアルタイム', desc: 'ストリーミング文字起こし対応' }
    ],
    limitations: ['API利用が前提（GUI製品ではない）', '日本語対応は限定的', '大量処理時はコスト管理が必要'],
    url: 'https://www.assemblyai.com/'
  },
  'deepgram': {
    company: 'Deepgram',
    country: '米国',
    pricing: '従量課金（$0.0043/分〜）',
    category: '音声認識API',
    features: [
      { name: 'Nova-2', desc: '高速・高精度な最新モデル' },
      { name: 'リアルタイム', desc: '低レイテンシのストリーミング' },
      { name: 'カスタム語彙', desc: '専門用語の認識精度を向上' }
    ],
    limitations: ['API利用が前提', '日本語対応は発展途上', 'Whisperと比べると知名度が低い'],
    url: 'https://deepgram.com/'
  },
  'whisper-api': {
    company: 'OpenAI',
    country: '米国',
    pricing: '$0.006/分',
    category: '音声認識API',
    features: [
      { name: '多言語対応', desc: '99言語の文字起こし・翻訳' },
      { name: 'オープンソース', desc: 'ローカル実行も可能（無料）' },
      { name: '高精度', desc: '日本語を含む多言語で高い認識率' }
    ],
    limitations: ['リアルタイム処理は自前実装が必要', 'ローカル実行には高性能GPUが必要', 'API版は音声ファイルサイズ制限あり'],
    url: 'https://platform.openai.com/docs/guides/speech-to-text'
  },
  'taskade': {
    company: 'Taskade',
    country: '米国',
    pricing: '無料版 / Pro $8/月',
    category: 'AIタスク管理',
    features: [
      { name: 'AIエージェント', desc: 'タスク管理・プロジェクト運営を自動化' },
      { name: 'マインドマップ', desc: 'AIがアイデアを構造化' },
      { name: 'チャット', desc: 'プロジェクト内でAIと対話' }
    ],
    limitations: ['機能が多すぎて学習コストがある', '単純なタスク管理には過剰', '日本語UIは一部のみ'],
    url: 'https://www.taskade.com/'
  },
  'mem-ai': {
    company: 'Mem',
    country: '米国',
    pricing: '無料版 / Pro $14.99/月',
    category: 'AIノートアプリ',
    features: [
      { name: '自動整理', desc: 'メモを自動でタグ付け・リンク' },
      { name: 'AI検索', desc: '自然言語で過去のメモを検索' },
      { name: 'ミーティングメモ', desc: 'カレンダー連携で会議メモを自動作成' }
    ],
    limitations: ['日本語対応は限定的', 'モバイルアプリの機能が限定的', 'Notionほどの自由度はない'],
    url: 'https://mem.ai/'
  },
  'otter-ai': {
    company: 'Otter.ai',
    country: '米国',
    pricing: '無料版 / Pro $16.99/月',
    category: 'AI議事録',
    features: [
      { name: '自動文字起こし', desc: '会議の音声をリアルタイムでテキスト化' },
      { name: '話者識別', desc: '誰が何を言ったかを自動判別' },
      { name: 'Zoom/Meet連携', desc: 'オンライン会議に自動参加' }
    ],
    limitations: ['日本語対応は限定的', '英語以外の精度が落ちる', '録音同意の取得に注意'],
    url: 'https://otter.ai/'
  },
  'fireflies-ai': {
    company: 'Fireflies.ai',
    country: '米国',
    pricing: '無料版 / Pro $18/月',
    category: 'AI議事録',
    features: [
      { name: '自動参加', desc: 'Zoom/Meet/Teamsに自動で参加・録音' },
      { name: 'AIサマリー', desc: '会議内容を自動要約・アクション抽出' },
      { name: 'CRM連携', desc: 'Salesforce/HubSpotと連携' }
    ],
    limitations: ['参加者に録音ボットが見える', '日本語の精度は英語より劣る', '会議録音の同意取得が必要'],
    url: 'https://fireflies.ai/'
  },
  'supernormal': {
    company: 'Supernormal',
    country: '米国',
    pricing: '無料版 / Pro $24/月',
    category: 'AI議事録',
    features: [
      { name: 'GPT-4要約', desc: '会議内容を構造化された要約に' },
      { name: 'テンプレート', desc: '1on1、セールス等用途別フォーマット' },
      { name: 'Slack共有', desc: '要約をSlackに自動投稿' }
    ],
    limitations: ['録音品質に要約精度が依存', '日本語対応は限定的', 'カスタマイズ性は他ツールに劣る'],
    url: 'https://supernormal.com/'
  },
  'bubble': {
    company: 'Bubble',
    country: '米国',
    pricing: '無料版 / Starter $32/月',
    category: 'ノーコード開発',
    features: [
      { name: 'ビジュアル開発', desc: 'ドラッグ&ドロップでWebアプリ構築' },
      { name: 'データベース', desc: '組み込みDBでバックエンド不要' },
      { name: 'プラグイン', desc: '決済、認証等の機能を追加' }
    ],
    limitations: ['複雑なアプリはパフォーマンスが落ちる', '独自の学習曲線がある', 'ベンダーロックインのリスク'],
    url: 'https://bubble.io/'
  },
  'webflow': {
    company: 'Webflow',
    country: '米国',
    pricing: '無料版 / Basic $18/月',
    category: 'ノーコードWeb制作',
    features: [
      { name: 'デザイン自由度', desc: 'CSSレベルのカスタマイズをGUIで' },
      { name: 'CMS', desc: 'ブログ・ポートフォリオを管理' },
      { name: 'Eコマース', desc: 'オンラインストア構築' }
    ],
    limitations: ['学習コストが比較的高い', 'ダイナミックな機能は制限あり', '高度なアニメーションは重くなる'],
    url: 'https://webflow.com/'
  },
  'framer': {
    company: 'Framer',
    country: 'オランダ',
    pricing: '無料版 / Mini $5/月',
    category: 'ノーコードWeb制作',
    features: [
      { name: 'AIサイト生成', desc: 'プロンプトからサイトを自動生成' },
      { name: 'インタラクション', desc: 'リッチなアニメーションを簡単に' },
      { name: 'デザイン→コード', desc: 'Figmaからのインポート対応' }
    ],
    limitations: ['ブログ・CMS機能は発展途上', 'SEO対策は手動設定が必要', 'Webflowほどの自由度はない'],
    url: 'https://www.framer.com/'
  },
  'glide': {
    company: 'Glide',
    country: '米国',
    pricing: '無料版 / Starter $25/月',
    category: 'ノーコードアプリ',
    features: [
      { name: 'スプレッドシート連携', desc: 'GoogleシートをDBとしてアプリ構築' },
      { name: 'テンプレート', desc: '業務アプリの雛形から開始' },
      { name: 'PWA', desc: 'インストール可能なWebアプリとして配布' }
    ],
    limitations: ['複雑なロジックの実装は難しい', 'デザインの自由度に限界', 'ネイティブアプリほどの体験は得られない'],
    url: 'https://www.glideapps.com/'
  },
  'uizard': {
    company: 'Uizard',
    country: 'デンマーク',
    pricing: '無料版 / Pro $19/月',
    category: 'AIデザインツール',
    features: [
      { name: 'スケッチ→デザイン', desc: '手描きスケッチをUIに変換' },
      { name: 'スクリーンショット変換', desc: '既存UIを編集可能なデザインに' },
      { name: 'AIアシスタント', desc: 'テキストからUIコンポーネント生成' }
    ],
    limitations: ['プロフェッショナルなデザインには物足りない', 'Figmaへのエクスポートは限定的', '複雑なインタラクションは非対応'],
    url: 'https://uizard.io/'
  },
  'galileo-ai': {
    company: 'Galileo AI',
    country: '米国',
    pricing: 'ウェイトリスト / 価格未公開',
    category: 'AIデザインツール',
    features: [
      { name: 'テキスト→UI', desc: '自然言語からUIデザインを生成' },
      { name: '高品質出力', desc: 'プロレベルのデザインを自動生成' },
      { name: 'Figmaエクスポート', desc: '編集可能な形式で出力' }
    ],
    limitations: ['現在ウェイトリスト制', '価格・プランが未公開', '実際の使用感は限定的な情報のみ'],
    url: 'https://www.usegalileo.ai/'
  },
  'diagram': {
    company: 'Diagram (Figma)',
    country: '米国',
    pricing: 'Figmaに統合（予定）',
    category: 'AIデザインツール',
    features: [
      { name: 'Magician', desc: 'Figmaプラグインでアイコン・コピー生成' },
      { name: 'Genius', desc: 'デザインを自動レイアウト' },
      { name: 'Automator', desc: 'デザインタスクを自動化' }
    ],
    limitations: ['Figma利用が前提', 'スタンドアロンでは使えない', 'Figma買収後の動向は不透明'],
    url: 'https://diagram.com/'
  },
  'surfer-seo': {
    company: 'Surfer',
    country: 'ポーランド',
    pricing: 'Essential $99/月',
    category: 'SEO AIツール',
    features: [
      { name: 'コンテンツエディタ', desc: 'SEOスコアをリアルタイム表示しながら執筆' },
      { name: 'キーワードリサーチ', desc: 'AI がキーワードクラスターを提案' },
      { name: '競合分析', desc: '上位表示ページの構成を分析' }
    ],
    limitations: ['価格が高め（$99/月〜）', '日本語SEOの精度は英語より劣る', '小規模サイトにはオーバースペック'],
    url: 'https://surferseo.com/'
  },
  'marketmuse': {
    company: 'MarketMuse',
    country: '米国',
    pricing: '無料版 / Standard $149/月',
    category: 'SEO AIツール',
    features: [
      { name: 'コンテンツ監査', desc: '既存コンテンツの改善点を自動分析' },
      { name: 'トピックモデリング', desc: '関連キーワード・トピックを提案' },
      { name: '競合ギャップ分析', desc: '競合が書いて自分が書いていないトピック' }
    ],
    limitations: ['非常に高価（$149/月〜）', 'エンタープライズ向け', '日本語対応は限定的'],
    url: 'https://www.marketmuse.com/'
  },
  'sourcegraph-cody': {
    company: 'Sourcegraph',
    country: '米国',
    pricing: '無料版 / Pro $9/月',
    category: 'AIコードアシスタント',
    features: [
      { name: 'コードベース理解', desc: '大規模リポジトリ全体を把握' },
      { name: 'コンテキスト検索', desc: '関連コードを自動で参照' },
      { name: 'マルチリポジトリ', desc: '複数リポジトリを横断して検索' }
    ],
    limitations: ['セットアップに手間がかかる', '小規模プロジェクトにはオーバースペック', 'エンタープライズ機能は高価'],
    url: 'https://sourcegraph.com/cody'
  },
  'supermaven': {
    company: 'Supermaven',
    country: '米国',
    pricing: '無料版 / Pro $10/月',
    category: 'AIコード補完',
    features: [
      { name: '超高速補完', desc: '業界最速レベルのレスポンス' },
      { name: '100万トークン', desc: '巨大なコンテキストウィンドウ' },
      { name: 'VS Code/JetBrains', desc: '主要エディタをサポート' }
    ],
    limitations: ['後発のため実績が少ない', 'Copilotほどの機能は網羅していない', 'チャット機能は限定的'],
    url: 'https://supermaven.com/'
  },
  'aider': {
    company: 'Paul Gauthier（個人）',
    country: '米国',
    pricing: '無料（オープンソース）',
    category: 'AIペアプログラミング',
    features: [
      { name: 'ターミナルAI', desc: 'CLIでGPT-4/Claudeとペアプロ' },
      { name: 'Git統合', desc: '変更を自動でコミット' },
      { name: 'マルチファイル', desc: '複数ファイルを同時に編集' }
    ],
    limitations: ['CLIのみでGUIはない', 'API課金は自分持ち', 'セットアップに技術知識が必要'],
    url: 'https://aider.chat/'
  },
  'codeium': {
    company: 'Codeium',
    country: '米国',
    pricing: '個人無料 / Team $12/月',
    category: 'AIコード補完',
    features: [
      { name: '個人永久無料', desc: '個人利用は制限なく無料' },
      { name: '70+言語', desc: '幅広いプログラミング言語対応' },
      { name: 'チャット', desc: 'コードについて質問・相談' }
    ],
    limitations: ['Copilotほどの精度・機能はない場合あり', 'エンタープライズ機能は有料', 'コミュニティが小さい'],
    url: 'https://codeium.com/'
  },
  'amazon-codewhisperer': {
    company: 'Amazon (AWS)',
    country: '米国',
    pricing: '個人無料 / Professional $19/月',
    category: 'AIコード補完',
    features: [
      { name: 'AWS統合', desc: 'AWSサービスのコード生成に強い' },
      { name: 'セキュリティスキャン', desc: '脆弱性を自動検出' },
      { name: '参照追跡', desc: 'オープンソースコードの出典を表示' }
    ],
    limitations: ['AWS以外のコード生成は他ツールに劣る', 'IDE対応が限定的', 'Copilotほどの汎用性はない'],
    url: 'https://aws.amazon.com/codewhisperer/'
  },
  'jetbrains-ai': {
    company: 'JetBrains',
    country: 'チェコ',
    pricing: 'JetBrains IDEに付属（要サブスク）',
    category: 'AIコードアシスタント',
    features: [
      { name: 'IDE統合', desc: 'IntelliJ/WebStorm等にネイティブ統合' },
      { name: 'AIチャット', desc: 'IDE内でコードについて質問' },
      { name: 'コード生成', desc: 'コンテキストを理解した補完' }
    ],
    limitations: ['JetBrains IDEが必要', 'Copilotほどの成熟度はまだない', 'サブスクリプション費用がかかる'],
    url: 'https://www.jetbrains.com/ai/'
  },
  'autogpt': {
    company: 'Significant Gravitas',
    country: 'コミュニティ',
    pricing: '無料（オープンソース）',
    category: '自律型AIエージェント',
    features: [
      { name: '自律実行', desc: '目標を与えると自分でタスク分解・実行' },
      { name: 'ツール利用', desc: 'Web検索、ファイル操作等を自動で' },
      { name: 'メモリ', desc: '長期記憶で文脈を保持' }
    ],
    limitations: ['実用レベルの成功率はまだ低い', 'API費用が予測しづらい', '暴走リスクがある'],
    url: 'https://github.com/Significant-Gravitas/AutoGPT'
  },
  'agentgpt': {
    company: 'Reworkd',
    country: '米国',
    pricing: '無料版 / Pro $40/月',
    category: '自律型AIエージェント',
    features: [
      { name: 'ブラウザ実行', desc: 'インストール不要でブラウザから利用' },
      { name: '目標設定', desc: 'ゴールを入力するとタスク自動実行' },
      { name: 'ログ表示', desc: '思考過程をリアルタイム表示' }
    ],
    limitations: ['複雑なタスクの成功率は低い', 'API費用は別途必要', '実用性はまだ限定的'],
    url: 'https://agentgpt.reworkd.ai/'
  },
  'crewai': {
    company: 'CrewAI',
    country: '米国',
    pricing: '無料（オープンソース）',
    category: 'マルチエージェントフレームワーク',
    features: [
      { name: 'ロール定義', desc: '複数のAIエージェントに役割を設定' },
      { name: 'タスク委任', desc: 'エージェント間でタスクを受け渡し' },
      { name: 'Python API', desc: 'シンプルなPythonコードで構築' }
    ],
    limitations: ['開発者向け（GUIなし）', 'LLM API費用は別途', '大規模利用はコスト管理が必要'],
    url: 'https://www.crewai.com/'
  },
  'langchain': {
    company: 'LangChain',
    country: '米国',
    pricing: '無料（オープンソース）/ LangSmith有料',
    category: 'LLMアプリフレームワーク',
    features: [
      { name: 'チェーン', desc: 'LLM呼び出しを連鎖させる' },
      { name: 'エージェント', desc: 'ツールを使う自律AIを構築' },
      { name: 'RAG', desc: '外部データを検索・参照する仕組み' }
    ],
    limitations: ['学習曲線が急', '抽象化が複雑になりがち', '頻繁なAPI変更で追従が大変'],
    url: 'https://www.langchain.com/'
  },
  'datarobot': {
    company: 'DataRobot',
    country: '米国',
    pricing: 'エンタープライズ（要問い合わせ）',
    category: 'AutoML',
    features: [
      { name: '自動モデル構築', desc: 'データを入れるだけでML モデルを自動生成' },
      { name: 'モデル比較', desc: '複数アルゴリズムを自動でベンチマーク' },
      { name: 'デプロイ', desc: '本番APIとしてワンクリックデプロイ' }
    ],
    limitations: ['エンタープライズ価格で個人には高い', '細かいカスタマイズは制限あり', 'ブラックボックス化しやすい'],
    url: 'https://www.datarobot.com/'
  },
  'obviously-ai': {
    company: 'Obviously AI',
    country: '米国',
    pricing: '$75/月〜',
    category: 'ノーコードML',
    features: [
      { name: 'ノーコード予測', desc: 'CSVアップロードで予測モデル構築' },
      { name: '説明可能AI', desc: '予測根拠を自然言語で説明' },
      { name: '統合', desc: 'Zapier/API経由で他ツールと連携' }
    ],
    limitations: ['高度なカスタマイズは不可', '大規模データには向かない', '機能が限定的'],
    url: 'https://www.obviously.ai/'
  },
  'character-ai': {
    company: 'Character Technologies',
    country: '米国',
    pricing: '無料版 / c.ai+ $9.99/月',
    category: 'AIキャラクターチャット',
    features: [
      { name: 'キャラ作成', desc: '独自のAIキャラクターを作成' },
      { name: '多様なキャラ', desc: '有名人・フィクションキャラと会話' },
      { name: 'ロールプレイ', desc: 'シナリオベースの対話' }
    ],
    limitations: ['情報の正確性は保証されない', '一部キャラは権利的にグレー', '依存性に注意'],
    url: 'https://character.ai/'
  },
  'poe': {
    company: 'Quora',
    country: '米国',
    pricing: '無料版 / 月額$16.67',
    category: 'AIチャットアグリゲーター',
    features: [
      { name: 'マルチモデル', desc: 'GPT-4、Claude、Gemini等を一箇所で' },
      { name: 'ボット作成', desc: 'カスタムAIボットを作成・共有' },
      { name: 'API', desc: '作成したボットをAPIで利用' }
    ],
    limitations: ['各モデルの利用回数に制限', 'ネイティブアプリほどの機能はない', '最新モデルへの対応にタイムラグ'],
    url: 'https://poe.com/'
  },
  'pi-ai': {
    company: 'Inflection AI',
    country: '米国',
    pricing: '無料',
    category: 'パーソナルAI',
    features: [
      { name: '共感的会話', desc: '感情に寄り添った対話' },
      { name: '音声対話', desc: '自然な音声での会話が可能' },
      { name: 'パーソナライズ', desc: '会話履歴から好みを学習' }
    ],
    limitations: ['タスク実行・情報検索には弱い', '実用ツールというより対話相手', '日本語対応は限定的'],
    url: 'https://pi.ai/'
  },
  'cohere-command': {
    company: 'Cohere',
    country: 'カナダ',
    pricing: '従量課金（$1/1M tokens〜）',
    category: 'エンタープライズLLM',
    features: [
      { name: 'Command R+', desc: 'RAG・ツール利用に最適化されたモデル' },
      { name: 'Embed', desc: '高品質なテキスト埋め込み' },
      { name: 'エンタープライズ', desc: 'データプライバシー・カスタマイズ対応' }
    ],
    limitations: ['OpenAI/Anthropicほどの知名度がない', 'コミュニティ・ドキュメントが少ない', '日本語の性能は英語より劣る'],
    url: 'https://cohere.com/'
  },
  'dotnet': {
    company: 'Microsoft',
    country: '米国',
    pricing: '無料（オープンソース）',
    category: '開発フレームワーク',
    features: [
      { name: 'クロスプラットフォーム', desc: 'Windows/macOS/Linuxで動作' },
      { name: 'AI統合', desc: 'ML.NET、Semantic Kernelでai機能追加' },
      { name: 'パフォーマンス', desc: '高速な実行速度' }
    ],
    limitations: ['学習曲線がある', 'エコシステムがMicrosoft寄り', 'AI特化ではない汎用フレームワーク'],
    url: 'https://dotnet.microsoft.com/'
  },
  'visual-studio': {
    company: 'Microsoft',
    country: '米国',
    pricing: 'Community無料 / Pro $45/月',
    category: '統合開発環境',
    features: [
      { name: 'フル機能IDE', desc: '.NET/C++/Python等の開発環境' },
      { name: 'IntelliCode', desc: 'AIコード補完（Copilot連携も）' },
      { name: 'デバッガ', desc: '強力なデバッグ・プロファイリング' }
    ],
    limitations: ['Windows中心（Mac版は機能限定）', '重量級で起動が遅い', 'VS Codeの台頭で存在感低下'],
    url: 'https://visualstudio.microsoft.com/'
  },
  'zed': {
    company: 'Zed Industries',
    country: '米国',
    pricing: '無料（オープンソース）',
    category: '高速エディタ',
    features: [
      { name: '超高速', desc: 'Rustで構築された高パフォーマンス' },
      { name: 'AIアシスタント', desc: 'GPT-4/Claude連携のコード支援' },
      { name: 'コラボ', desc: 'リアルタイム共同編集' }
    ],
    limitations: ['macOS/Linux のみ（Windows未対応）', 'VS Codeほどの拡張エコシステムがない', '発展途上で機能追加中'],
    url: 'https://zed.dev/'
  }
};

// デフォルトの改善テンプレート
function improveProduct(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const slug = path.basename(filePath, '.md');
  const info = productInfo[slug];
  
  if (!info) {
    console.log(`Skipping ${slug} - no product info available`);
    return false;
  }
  
  // フロントマターを抽出
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return false;
  
  const frontmatter = frontmatterMatch[1];
  const bodyStart = content.indexOf('---', 4) + 4;
  
  // タイトル取得
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1].split(' — ')[0] : slug;
  
  // 新しい本文を生成
  const newBody = `

> 最終情報更新: 2026-02-16

| 項目 | 詳細 |
|------|------|
| 種別 | ${info.category} |
| 開発元 | ${info.company} / ${info.country} |
| 料金 | ${info.pricing} |

## ${title}とは？

${info.features.map(f => f.desc).join('。')}。

## 主要機能

${info.features.map(f => `### ${f.name}\n${f.desc}。`).join('\n\n')}

## 料金

${info.pricing}

## ソロビルダー向けの使いどころ

- プロダクト開発の効率化
- 反復作業の自動化
- 品質向上と時間短縮

## 注意点・制限

${info.limitations.map(l => `- ${l}`).join('\n')}

## 公式リンク

- 公式サイト: ${info.url}
`;

  const newContent = content.substring(0, bodyStart) + newBody;
  fs.writeFileSync(filePath, newContent);
  console.log(`Improved: ${slug}`);
  return true;
}

// メイン処理
const productsDir = '/Users/satokeita/Dev/ai-solo-builder/content/products';
const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.md'));

let improved = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(productsDir, file);
  if (improveProduct(filePath)) {
    improved++;
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${improved} improved, ${skipped} skipped`);
