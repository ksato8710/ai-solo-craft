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

  console.log('🔧 Step-by-step table structure fix...\n');

  try {
    // Step 1: 現在のテーブル確認
    console.log('📋 Step 1: Checking current table...');
    const { data: existing, count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' })
      .limit(1);

    console.log(`✅ Table exists with ${count || 0} records`);

    if (existing && existing.length > 0) {
      console.log('Current structure:', Object.keys(existing[0]));
    }

    // Step 2: 必要最小限のテーブル作成 SQL を構成
    const createMinimalTableSQL = `
-- Minimal table for content sources
CREATE TABLE IF NOT EXISTS content_sources_new AS 
SELECT 
  gen_random_uuid() as id,
  'Sample' as name,
  'https://example.com' as url,
  'tech' as category,
  3 as quality_rating,
  3 as accessibility_rating,
  true as is_free,
  true as is_active,
  'Description' as description,
  NOW() as created_at,
  NOW() as updated_at
WHERE false; -- No actual data, just structure
`;

    // Step 3: 簡単なデータ挿入テスト
    const testSources = [
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        category: 'tech-community'
      },
      {
        name: 'GitHub Trending',
        url: 'https://github.com/trending', 
        category: 'dev-tools'
      }
    ];

    console.log('\n📝 Step 2: Testing minimal data insertion...');
    
    for (const source of testSources) {
      try {
        // 段階的にフィールドを追加してテスト
        const { data: insertResult, error: insertError } = await supabase
          .from('content_sources')
          .upsert([source], { onConflict: 'url' })
          .select();

        if (insertError) {
          console.error(`❌ Failed to insert ${source.name}:`, insertError.message);
          
          if (insertError.message.includes('quality_rating')) {
            // quality_rating フィールドを追加してリトライ
            source.quality_rating = 4;
            source.accessibility_rating = 4;
            source.is_free = true;
            source.is_active = true;
            source.description = `Information source: ${source.name}`;
            
            console.log(`   🔧 Adding missing fields for ${source.name}...`);
            const { data: retryResult, error: retryError } = await supabase
              .from('content_sources')
              .upsert([source], { onConflict: 'url' })
              .select();

            if (retryError) {
              console.error(`   ❌ Retry failed:`, retryError.message);
            } else {
              console.log(`   ✅ Success with extended fields`);
            }
          }
        } else {
          console.log(`✅ Successfully inserted ${source.name}`);
        }
      } catch (error) {
        console.error(`❌ Error with ${source.name}:`, error.message);
      }
    }

    // Step 4: 完全な初期データセット
    console.log('\n📥 Step 3: Complete dataset insertion...');
    const fullSources = [
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        category: 'tech-community',
        quality_rating: 4,
        accessibility_rating: 5,
        is_free: true,
        is_active: true,
        description: 'プログラマー・起業家コミュニティによる技術ニュースのランキングサイト'
      },
      {
        name: 'GitHub Trending',
        url: 'https://github.com/trending',
        category: 'dev-tools',
        quality_rating: 4,
        accessibility_rating: 4,
        is_free: true,
        is_active: true,
        description: 'GitHubで注目されているオープンソースプロジェクトのトレンド'
      },
      {
        name: 'Indie Hackers',
        url: 'https://www.indiehackers.com',
        category: 'indie-business',
        quality_rating: 4,
        accessibility_rating: 4,
        is_free: true,
        is_active: true,
        description: '独立開発者・ソロ起業家のコミュニティ'
      },
      {
        name: 'Y Combinator News',
        url: 'https://www.ycombinator.com/blog',
        category: 'startup',
        quality_rating: 5,
        accessibility_rating: 4,
        is_free: true,
        is_active: true,
        description: 'YCによる起業家向けアドバイス・業界動向'
      }
    ];

    for (const source of fullSources) {
      try {
        const { data: result, error } = await supabase
          .from('content_sources')
          .upsert([source], { onConflict: 'url' })
          .select();

        if (error) {
          console.error(`❌ ${source.name}:`, error.message);
        } else {
          console.log(`✅ ${source.name} inserted/updated`);
        }
      } catch (error) {
        console.error(`❌ ${source.name} failed:`, error.message);
      }
    }

    // Step 5: 最終確認
    const { data: finalData, count: finalCount } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log('\n🎉 Step-by-step setup completed!');
    console.log(`📊 Total sources: ${finalCount}`);
    
    if (finalData && finalData.length > 0) {
      console.log('\n📋 Current sources:');
      finalData.forEach(source => {
        const rating = source.quality_rating ? `${source.quality_rating}⭐` : 'No rating';
        console.log(`- ${source.name} (${source.category}) - ${rating}`);
      });
    }

    console.log('\n🚀 Try accessing admin interface:');
    console.log('http://localhost:3000/admin/sources');

  } catch (error) {
    console.error('\n❌ Step-by-step setup failed:', error.message);
    
    if (error.code === '42P01') {
      console.log('\n🛠️  Table needs to be created manually:');
      console.log('Run this in Supabase Dashboard > SQL Editor:');
      console.log(`
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  quality_rating INTEGER DEFAULT 3,
  accessibility_rating INTEGER DEFAULT 3,
  is_free BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    }
  }
}

main();