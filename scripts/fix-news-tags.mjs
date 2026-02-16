#!/usr/bin/env node
/**
 * ニュース記事のタグ修正スクリプト
 * 分類タグ（dev-knowledge, case-study, product-update）を先頭に追加
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const TAG_METADATA = {
  'dev-knowledge': true,
  'case-study': true,
  'product-update': true,
  'ツール紹介': true,
  'other': true,
};

// コンテンツからカテゴリを推測
function inferCategory(title, description, tags) {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  
  // Case Study判定
  if (text.includes('事例') || text.includes('case') || text.includes('成功') || 
      text.includes('mrr') || text.includes('収益') || text.includes('ビジネス')) {
    return 'case-study';
  }
  
  // Product Update / ツール紹介判定
  if (text.includes('リリース') || text.includes('発表') || text.includes('ga') ||
      text.includes('新機能') || text.includes('アップデート') || text.includes('発売')) {
    return 'product-update';
  }
  
  // Dev Knowledge判定（技術解説、ガイド、比較）
  if (text.includes('ガイド') || text.includes('比較') || text.includes('使い方') ||
      text.includes('徹底') || text.includes('解説') || text.includes('入門') ||
      text.includes('tutorial') || text.includes('guide')) {
    return 'dev-knowledge';
  }
  
  // デフォルト: 時事ニュースはproduct-update（ツール関連が多い）
  return 'product-update';
}

const newsDir = './content/news';
const files = fs.readdirSync(newsDir).filter(f => f.endsWith('.md'));
let fixed = 0, skipped = 0;

const dryRun = process.argv.includes('--dry-run');

for (const file of files) {
  const filePath = path.join(newsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  
  // Digestはスキップ
  if (data.contentType === 'digest') {
    skipped++;
    continue;
  }
  
  const tags = data.tags || [];
  const hasClassificationTag = tags.some(t => TAG_METADATA[t]);
  
  if (hasClassificationTag) {
    skipped++;
    continue;
  }
  
  // 分類タグを推測
  const inferredTag = inferCategory(data.title || '', data.description || '', tags);
  const newTags = [inferredTag, ...tags];
  
  if (dryRun) {
    console.log(`[DRY] ${file}`);
    console.log(`  現在: ${JSON.stringify(tags)}`);
    console.log(`  修正後: ${JSON.stringify(newTags)}`);
    console.log('');
  } else {
    data.tags = newTags;
    const newContent = matter.stringify(body, data);
    fs.writeFileSync(filePath, newContent);
    console.log(`✓ ${file} → +${inferredTag}`);
  }
  fixed++;
}

console.log('');
console.log(`--- 結果 ---`);
console.log(`修正${dryRun ? '予定' : '完了'}: ${fixed}件`);
console.log(`スキップ: ${skipped}件`);
if (dryRun) {
  console.log('\n実行するには --dry-run を外してください');
}
