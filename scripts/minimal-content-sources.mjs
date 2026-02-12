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

  console.log('🔍 Testing minimal data insertion...\n');

  // Try the most basic data structure
  const minimalData = {
    name: 'Test Source',
    url: 'https://example.com'
  };

  console.log('📝 Trying insert with name + url only...');
  let { data, error } = await supabase
    .from('content_sources')
    .insert([minimalData])
    .select();

  if (error) {
    console.log('❌ name + url failed:', error.message);
    
    // Try with just url
    console.log('📝 Trying insert with url only...');
    const urlOnlyData = { url: 'https://example2.com' };
    
    const { data: data2, error: error2 } = await supabase
      .from('content_sources')
      .insert([urlOnlyData])
      .select();
    
    if (error2) {
      console.log('❌ url only failed:', error2.message);
      
      // Maybe the table needs to be created from scratch
      console.log('\n⚠️  It appears content_sources table may not have the expected structure.');
      console.log('Recommendation: Create a new table manually or drop and recreate content_sources');
      
      console.log('\n🔧 Suggested SQL for new table creation:');
      const sqlSuggestion = `
-- Drop existing table (if you're sure it's not needed)
-- DROP TABLE IF EXISTS content_sources;

-- Create new content_sources table with full schema
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_sources_category ON content_sources(category);
CREATE INDEX idx_content_sources_active ON content_sources(is_active);
CREATE INDEX idx_content_sources_free ON content_sources(is_free);
`;
      console.log(sqlSuggestion);
      
    } else {
      console.log('✅ url only succeeded:', data2);
      
      // Clean up
      await supabase
        .from('content_sources')
        .delete()
        .eq('url', 'https://example2.com');
    }
    
  } else {
    console.log('✅ name + url succeeded:', data);
    
    // Try adding description
    console.log('📝 Trying to add description...');
    const withDescription = {
      name: 'Test Source With Description',
      url: 'https://example3.com',
      description: 'Test description'
    };
    
    const { data: data3, error: error3 } = await supabase
      .from('content_sources')
      .insert([withDescription])
      .select();
    
    if (error3) {
      console.log('❌ description failed:', error3.message);
    } else {
      console.log('✅ description succeeded:', data3);
      
      // Clean up test data
      await supabase
        .from('content_sources')
        .delete()
        .eq('url', 'https://example3.com');
    }
    
    // Clean up original test
    await supabase
      .from('content_sources')
      .delete()
      .eq('url', 'https://example.com');
  }

  // Show current state
  const { data: currentData, error: currentError } = await supabase
    .from('content_sources')
    .select('*');
    
  if (!currentError) {
    console.log(`\n📋 Current table contents (${currentData.length} records):`);
    if (currentData.length > 0) {
      console.log('Sample record structure:', Object.keys(currentData[0]));
    }
  }
}

main().catch(console.error);