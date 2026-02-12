#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function loadProjectEnvFiles() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
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

  console.log('🔍 Inspecting content_sources table structure...\n');

  // Try to create a test record with minimal data
  const testData = {
    name: 'Test Source',
    url: 'https://example.com'
  };

  const { data, error } = await supabase
    .from('content_sources')
    .insert([testData])
    .select();

  if (error) {
    console.log('❌ Insert failed:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
    
    // Try to get more info about table structure
    const { data: selectData, error: selectError } = await supabase
      .from('content_sources')
      .select('*')
      .limit(0);
      
    if (selectError) {
      console.log('\n❌ Select failed:', selectError.message);
    } else {
      console.log('\n✅ Table exists and is accessible for SELECT');
    }
    
  } else {
    console.log('✅ Test insert successful!');
    console.log('Inserted data structure:', data[0]);
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('content_sources')
      .delete()
      .eq('url', 'https://example.com');
    
    if (!deleteError) {
      console.log('🧹 Test data cleaned up');
    }
  }

  // Try different column combinations to identify existing structure
  const possibleColumns = [
    ['name', 'url'],
    ['name', 'url', 'category'],
    ['name', 'url', 'type'],
    ['name', 'url', 'description'],
    ['id', 'name', 'url'],
    ['id', 'name', 'url', 'created_at'],
  ];

  for (const columns of possibleColumns) {
    try {
      const { data: testSelect } = await supabase
        .from('content_sources')
        .select(columns.join(','))
        .limit(1);
      
      console.log(`✅ Columns exist: ${columns.join(', ')}`);
    } catch (err) {
      console.log(`❌ Failed: ${columns.join(', ')}`);
    }
  }
}

main().catch(console.error);