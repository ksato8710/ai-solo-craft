#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ENV_FILES = ['.env.local', '.env'];

function loadProjectEnvFiles() {
  for (const envFile of ENV_FILES) {
    const absolutePath = path.join(ROOT, envFile);
    if (!fs.existsSync(absolutePath)) continue;

    const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^(export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      const key = match[2];
      let value = match[3].trim();
      
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadProjectEnvFiles();
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('🔍 Checking existing schema...\n');

  // Check all tables
  const tableNames = [
    'contents', 
    'content_sources',
    'tags',
    'products',
    'digest_details',
    'content_tags',
    'content_product_links'
  ];

  for (const table of tableNames) {
    console.log(`📋 Checking table: ${table}`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ ${error.message}`);
    } else {
      console.log(`   ✅ Table exists`);
      if (data && data.length > 0) {
        console.log(`   📝 Sample structure:`, Object.keys(data[0]).join(', '));
      }
    }
    console.log('');
  }

  // Specific check for content_sources
  console.log('📋 Detailed check for content_sources:');
  const { data: sourcesData, error: sourcesError } = await supabase
    .from('content_sources')
    .select('*')
    .limit(3);

  if (sourcesError) {
    console.log(`❌ Error: ${sourcesError.message}`);
  } else {
    console.log(`✅ Found ${sourcesData.length} records`);
    if (sourcesData.length > 0) {
      console.log('Sample data:');
      sourcesData.forEach((row, i) => {
        console.log(`${i + 1}. ${JSON.stringify(row, null, 2)}`);
      });
    }
  }
}

main().catch(console.error);