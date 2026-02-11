BEGIN;

INSERT INTO public.tags (code, label, description)
VALUES
  ('dev-knowledge', '開発ナレッジ', 'AI開発の実務知見、再現可能な技術ノウハウ'),
  ('case-study', 'ソロビルダー事例', 'ソロビルダーの成功・失敗を分析した事例記事'),
  ('product-update', 'プロダクトアップデート', '既存プロダクトの新機能・方針転換・価格改定など')
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  updated_at = now();

COMMIT;
