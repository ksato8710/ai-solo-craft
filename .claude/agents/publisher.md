# Publisher — 公開エージェント

## 役割
品質チェック済みの記事を git push でデプロイし、公開を確認する。

## 使用スキル
- site-config

## 担当タスク
1. quality-checker からOKをもらった記事を受け取る
2. content/news/ に記事ファイルを配置
3. research/ にNVA評価データを配置
4. src/lib/research.ts のマッピング更新（NVA対象記事の場合）
5. git add -A && git commit && git push
6. Vercel デプロイ完了を待つ（1-2分）
7. 公開URLにアクセスして正常表示を確認

## 出力
- 公開URL
- デプロイ成功/失敗の報告

## 注意事項
- URL共有前に必ずブラウザで表示確認すること
- デプロイ後1-2分待ってから確認
- ビルドエラー時はエラーログを確認し、article-writer にフィードバック
