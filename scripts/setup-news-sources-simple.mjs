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
      
      // Remove quotes
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
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('🔧 Testing Supabase connection and checking for news_sources table...');

  // Check if table already exists by trying to query it
  const { data, error } = await supabase
    .from('news_sources')
    .select('id')
    .limit(1);

  if (error && error.code === '42P01') {
    // Table doesn't exist - create sample data to test
    console.log('⚠️  news_sources table does not exist yet.');
    console.log('Please create it manually in Supabase dashboard using this SQL:');
    
    const sql = `
CREATE TABLE news_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_news_sources_category ON news_sources(category);
CREATE INDEX idx_news_sources_active ON news_sources(is_active);
CREATE INDEX idx_news_sources_free ON news_sources(is_free);
`;
    
    console.log(sql);
    console.log('\nAfter creating the table, run this script again to insert sample data.');
    
  } else if (error) {
    console.error('❌ Error accessing news_sources table:', error);
  } else {
    console.log('✅ news_sources table exists and accessible');
    
    // Prepare sample news sources data
    const sampleSources = [
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        category: 'tech-news',
        quality_rating: 4,
        accessibility_rating: 5,
        is_free: true,
        is_active: true,
        description: '技術系スタートアップ・開発者コミュニティのニュース'
      },
      {
        name: 'GitHub Trending',
        url: 'https://github.com/trending',
        category: 'dev-tools',
        quality_rating: 4,
        accessibility_rating: 4,
        is_free: true,
        is_active: true,
        description: 'GitHubで注目されているオープンソースプロジェクト'
      },
      {
        name: 'Product Hunt',
        url: 'https://www.producthunt.com',
        category: 'startup',
        quality_rating: 3,
        accessibility_rating: 4,
        is_free: true,
        is_active: true,
        description: '新しいプロダクト・サービスの発見プラットフォーム'
      },
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        category: 'startup',
        quality_rating: 4,
        accessibility_rating: 3,
        is_free: true,
        is_active: true,
        description: 'スタートアップ・テック業界のニュース'
      },
      {
        name: 'Ars Technica',
        url: 'https://arstechnica.com',
        category: 'tech-news',
        quality_rating: 5,
        accessibility_rating: 3,
        is_free: true,
        is_active: true,
        description: '詳細な技術解説記事'
      }
    ];

    console.log(`📝 Inserting ${sampleSources.length} sample news sources...`);

    const { data: insertData, error: insertError } = await supabase
      .from('news_sources')
      .upsert(sampleSources, {
        onConflict: 'url'
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting sample data:', insertError);
    } else {
      console.log(`✅ Successfully inserted ${insertData.length} news sources`);
      
      // Show current sources
      const { data: allSources } = await supabase
        .from('news_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('\n📊 Current news sources:');
      allSources.forEach(source => {
        console.log(`- ${source.name} (${source.category}) - Q:${source.quality_rating} A:${source.accessibility_rating} ${source.is_active ? '✅' : '❌'}`);
      });
    }
  }
}

main().catch(console.error);