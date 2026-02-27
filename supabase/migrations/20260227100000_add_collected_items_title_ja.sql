BEGIN;

ALTER TABLE collected_items
ADD COLUMN IF NOT EXISTS title_ja text;

-- Preserve readability for items that are already Japanese.
UPDATE collected_items
SET title_ja = title
WHERE title_ja IS NULL
  AND title ~ '[ぁ-んァ-ヶ一-龯々〆ヵヶ]';

CREATE INDEX IF NOT EXISTS idx_collected_items_title_ja
ON collected_items(title_ja);

COMMIT;
