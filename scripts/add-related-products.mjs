#!/usr/bin/env node
/**
 * add-related-products.mjs
 * relatedProductsが欠けている記事に追加する
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWS_DIR = path.join(__dirname, '../content/news');

// 記事ごとの関連プロダクト設定
const productMappings = {
  '2026-02-02-ai-solo-builder-era-2026.md': [],
  '2026-02-02-pieter-levels-solo-founder-strategy.md': [],
  '2026-02-10-saas-apocalypse-inhouse.md': ['n8n-ai-workflow-automation', 'make-integromat'],
  '2026-02-10-sleek-ai-mobile-design-10k-mrr.md': ['sleek-design'],
  'arxiv-gopd-distillation-beyond-teacher-2026-02-18.md': [],
  'arxiv-nrt-native-reasoning-training-2026-02-18.md': [],
  'arxiv-repetition-advantage-finetuning-2026-02-17.md': [],
  'arxiv-skillrl-agent-evolution-2026-02-16.md': ['autogpt', 'crewai', 'langchain'],
  'arxiv-stateLM-self-managing-context-2026-02-17.md': [],
  'lecun-ami-labs-world-models-2026-02-12.md': [],
  'morning-news-2026-02-11.md': ['github-copilot'],
  'noon-tools-2026-02-11.md': [],
  'openai-frontier-enterprise-revolution-2026-02-12.md': ['openai', 'chatgpt'],
  'prima-medical-ai-implementation-2026-02-12.md': [],
};

for (const [filename, products] of Object.entries(productMappings)) {
  const filePath = path.join(NEWS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skip (not found): ${filename}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('relatedProducts:')) {
    console.log(`⏭️  Skip (already has): ${filename}`);
    continue;
  }
  
  // frontmatterの最後の---の前に追加
  // featuredやtagsの後に追加
  const productsYaml = products.length > 0 
    ? `relatedProducts:\n${products.map(p => `  - ${p}`).join('\n')}\n`
    : `relatedProducts: []\n`;
  
  // frontmatter終了の---を探す
  const frontmatterEnd = content.indexOf('---', 4);
  if (frontmatterEnd === -1) {
    console.log(`❌ No frontmatter end: ${filename}`);
    continue;
  }
  
  // ---の直前に挿入
  const beforeEnd = content.slice(0, frontmatterEnd);
  const afterEnd = content.slice(frontmatterEnd);
  content = beforeEnd + productsYaml + afterEnd;
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated: ${filename} → [${products.join(', ')}]`);
}

console.log('\n🎉 Done!');
