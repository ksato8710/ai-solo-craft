#!/usr/bin/env node
/**
 * Check images in content files:
 * 1. All news/digest have `image` field set
 * 2. No duplicate image URLs across articles
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '../content/news');

function checkImages() {
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  const errors = [];
  const warnings = [];
  const imageUrls = new Map(); // url -> [files]

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let frontmatter;
    try {
      frontmatter = matter(content).data;
    } catch (e) {
      errors.push(`❌ ${file}: YAML parse error`);
      continue;
    }

    const { image, contentType } = frontmatter;

    // Check 1: image field exists for news/digest
    if (!image) {
      if (contentType === 'digest') {
        errors.push(`❌ ${file}: Digest記事にimageフィールドがありません`);
      } else {
        warnings.push(`⚠ ${file}: imageフィールドがありません（推奨）`);
      }
    } else {
      // Track image URLs for duplicate check
      if (!imageUrls.has(image)) {
        imageUrls.set(image, []);
      }
      imageUrls.get(image).push(file);
    }
  }

  // Check 2: No duplicate images (warning for now, will be error after cleanup)
  for (const [url, usedIn] of imageUrls) {
    if (usedIn.length > 1) {
      warnings.push(`⚠ 画像重複: ${url}\n   使用ファイル: ${usedIn.join(', ')}`);
    }
  }

  // Output results
  if (warnings.length > 0) {
    console.log('\n📋 Warnings:');
    warnings.forEach(w => console.log(w));
  }

  if (errors.length > 0) {
    console.log('\n🚨 Errors:');
    errors.forEach(e => console.log(e));
    console.log(`\n❌ check:images failed with ${errors.length} error(s)`);
    process.exit(1);
  }

  console.log(`✅ check:images passed (${files.length} files, ${imageUrls.size} unique images)`);
}

checkImages();
