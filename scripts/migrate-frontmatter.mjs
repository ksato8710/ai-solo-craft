#!/usr/bin/env node
/**
 * Canonical frontmatter migration script
 * Converts legacy `category` to `contentType` + `digestEdition` + `tags`
 * Converts `relatedProduct` (string) to `relatedProducts` (array)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '../content/news');
const productsDir = path.join(__dirname, '../content/products');

// Category to contentType/digestEdition/tags mapping
const categoryMapping = {
  'morning-summary': { contentType: 'digest', digestEdition: 'morning' },
  'morning-news': { contentType: 'digest', digestEdition: 'morning' },
  'evening-summary': { contentType: 'digest', digestEdition: 'evening' },
  'evening-news': { contentType: 'digest', digestEdition: 'evening' },
  'noon-tools': { contentType: 'news', tags: ['featured-tools'] },
  'featured-tools': { contentType: 'news', tags: ['featured-tools'] },
  'dev-knowledge': { contentType: 'news', tags: ['dev-knowledge'] },
  'case-study': { contentType: 'news', tags: ['case-study'] },
  'news': { contentType: 'news' },
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  
  const frontmatterLines = match[1].split('\n');
  const body = match[2];
  const frontmatter = {};
  
  for (const line of frontmatterLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  
  return { frontmatter, body, rawFrontmatter: match[1] };
}

function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseFrontmatter(content);
  if (!parsed) {
    console.log(`⚠️ Skipping (no frontmatter): ${path.basename(filePath)}`);
    return false;
  }
  
  const { frontmatter, body } = parsed;
  let modified = false;
  
  // 1. Migrate category -> contentType + digestEdition + tags
  if (frontmatter.category && !frontmatter.contentType) {
    const category = frontmatter.category;
    const mapping = categoryMapping[category];
    
    if (mapping) {
      frontmatter.contentType = mapping.contentType;
      if (mapping.digestEdition) {
        frontmatter.digestEdition = mapping.digestEdition;
      }
      if (mapping.tags) {
        frontmatter.tags = mapping.tags;
      }
      delete frontmatter.category;
      modified = true;
      console.log(`  ✅ category "${category}" → contentType: ${mapping.contentType}${mapping.digestEdition ? `, digestEdition: ${mapping.digestEdition}` : ''}${mapping.tags ? `, tags: [${mapping.tags.join(', ')}]` : ''}`);
    } else {
      console.log(`  ⚠️ Unknown category: ${category}`);
    }
  }
  
  // 2. Migrate relatedProduct -> relatedProducts (array)
  if (frontmatter.relatedProduct && !frontmatter.relatedProducts) {
    const product = frontmatter.relatedProduct;
    frontmatter.relatedProducts = [product];
    delete frontmatter.relatedProduct;
    modified = true;
    console.log(`  ✅ relatedProduct "${product}" → relatedProducts: ["${product}"]`);
  }
  
  if (!modified) {
    console.log(`  ⏭️ No migration needed: ${path.basename(filePath)}`);
    return false;
  }
  
  // Rebuild frontmatter
  const newFrontmatterLines = [];
  const fieldOrder = ['title', 'slug', 'date', 'contentType', 'digestEdition', 'description', 'readTime', 'tags', 'relatedProducts'];
  
  // Add ordered fields first
  for (const field of fieldOrder) {
    if (frontmatter[field] !== undefined) {
      if (Array.isArray(frontmatter[field])) {
        newFrontmatterLines.push(`${field}:`);
        for (const item of frontmatter[field]) {
          newFrontmatterLines.push(`  - "${item}"`);
        }
      } else if (field === 'tags' && typeof frontmatter[field] === 'string') {
        // Handle tags as array
        newFrontmatterLines.push(`tags:`);
        newFrontmatterLines.push(`  - "${frontmatter[field]}"`);
      } else {
        newFrontmatterLines.push(`${field}: "${frontmatter[field]}"`);
      }
    }
  }
  
  // Add remaining fields
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!fieldOrder.includes(key)) {
      if (Array.isArray(value)) {
        newFrontmatterLines.push(`${key}:`);
        for (const item of value) {
          newFrontmatterLines.push(`  - "${item}"`);
        }
      } else {
        newFrontmatterLines.push(`${key}: "${value}"`);
      }
    }
  }
  
  const newContent = `---\n${newFrontmatterLines.join('\n')}\n---\n${body}`;
  fs.writeFileSync(filePath, newContent);
  return true;
}

function migrateDirectory(dir, label) {
  console.log(`\n📁 Migrating ${label}...`);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  let migrated = 0;
  
  for (const file of files) {
    console.log(`\n📄 ${file}`);
    if (migrateFile(path.join(dir, file))) {
      migrated++;
    }
  }
  
  console.log(`\n✅ ${label}: ${migrated}/${files.length} files migrated`);
  return migrated;
}

console.log('🚀 Starting canonical frontmatter migration...\n');

const newsCount = migrateDirectory(contentDir, 'content/news');
const productsCount = migrateDirectory(productsDir, 'content/products');

console.log(`\n🎉 Migration complete! Total: ${newsCount + productsCount} files updated`);
