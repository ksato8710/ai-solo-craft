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

  if (!url || !serviceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('🔍 Checking content_sources table...');

  try {
    const { data, error } = await supabase
      .from('content_sources')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ content_sources table does not exist');
        console.log('Please run the SQL in /sql/create_content_sources_table.sql');
        return false;
      } else {
        console.log('❌ Error accessing table:', error.message);
        return false;
      }
    }

    console.log('✅ content_sources table exists and accessible');
    
    // Get count and sample data
    const { data: countData, error: countError } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact', head: false });

    if (countError) {
      console.log('⚠️  Could not get count:', countError.message);
    } else {
      console.log(`📊 Found ${countData.length} records`);
      
      if (countData.length > 0) {
        console.log('📋 Sample record:');
        const sample = countData[0];
        console.log(`- ${sample.name} (${sample.category})`);
        console.log(`- Quality: ${sample.quality_rating}/5, Accessibility: ${sample.accessibility_rating}/5`);
        console.log(`- Free: ${sample.is_free}, Active: ${sample.is_active}`);
      }
    }

    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

main().then(success => {
  if (success) {
    console.log('\n✅ Ready to create admin interface!');
  } else {
    console.log('\n❌ Please create the table first before running admin interface');
  }
}).catch(console.error);