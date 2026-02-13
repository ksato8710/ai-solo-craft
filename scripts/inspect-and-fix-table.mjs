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

  console.log('🔍 Inspecting current table structure...\n');

  try {
    // 空のSELECTでテーブル構造を確認
    const { data, error } = await supabase
      .from('content_sources')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Error accessing content_sources:', error.message);
      
      if (error.code === '42P01') {
        console.log('\n🔨 Creating content_sources table from scratch...');
        console.log('Please execute this SQL in Supabase Dashboard > SQL Editor:');
        console.log('\n--- SQL TO EXECUTE ---');
        
        const createSQL = `
-- Create content_sources table
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5) DEFAULT 3,
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5) DEFAULT 3,
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

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_content_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger
CREATE TRIGGER update_content_sources_updated_at_trigger
  BEFORE UPDATE ON content_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_content_sources_updated_at();
`;

        console.log(createSQL);
        console.log('\n--- END SQL ---\n');
        console.log('After executing the SQL, run this script again to add initial data.');
        return;
      }
      
      throw error;
    }

    console.log('✅ Table exists and accessible');

    // 既存のデータ確認
    const { data: existingData, count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log(`📊 Current records: ${count}`);

    if (count > 0) {
      console.log('📋 Existing data found:');
      existingData?.forEach(source => {
        console.log(`- ${source.name}: ${source.url}`);
      });
      console.log('\n⚠️  Table has existing data. Proceeding with care...');
    }

    // 最小限のテストデータで構造確認
    const testSource = {
      name: 'Structure Test',
      url: 'https://structure-test.example.com',
    };

    // 最小限の必須フィールドでテスト
    console.log('🧪 Testing minimal insert...');
    const { data: minimalTest, error: minimalError } = await supabase
      .from('content_sources')
      .insert([testSource])
      .select();

    if (minimalError) {
      if (minimalError.message.includes('category')) {
        testSource.category = 'test';
        console.log('🔧 Adding category field...');
        
        const { data: categoryTest, error: categoryError } = await supabase
          .from('content_sources')
          .insert([testSource])
          .select();

        if (categoryError) {
          console.error('❌ Category test failed:', categoryError.message);
          console.log('\n📋 Current table structure issue:');
          console.log('The table exists but is missing required columns.');
          console.log('\nRequired columns:');
          console.log('- name (VARCHAR)');
          console.log('- url (VARCHAR, UNIQUE)');
          console.log('- category (VARCHAR)');
          console.log('- quality_rating (INTEGER)');
          console.log('- accessibility_rating (INTEGER)');
          console.log('- is_free (BOOLEAN)');
          console.log('- is_active (BOOLEAN)');
          console.log('- description (TEXT)');
          
          console.log('\n🔨 Please add missing columns with this SQL:');
          console.log(`
ALTER TABLE content_sources 
ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5) DEFAULT 3,
ADD COLUMN IF NOT EXISTS accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5) DEFAULT 3,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;
`);
          return;
        } else {
          console.log('✅ Basic structure working');
          // テストデータを削除
          await supabase
            .from('content_sources')
            .delete()
            .eq('url', testSource.url);
        }
      }
    } else {
      console.log('✅ Minimal structure working');
      // テストデータを削除
      await supabase
        .from('content_sources')
        .delete()
        .eq('url', testSource.url);
    }

    // 完全な初期データで最終テスト
    const fullTestSource = {
      name: 'Full Test Source',
      url: 'https://full-test.example.com',
      category: 'test',
      quality_rating: 3,
      accessibility_rating: 3,
      is_free: true,
      is_active: false,
      description: 'Full structure test'
    };

    console.log('🧪 Testing full structure...');
    const { data: fullTest, error: fullError } = await supabase
      .from('content_sources')
      .insert([fullTestSource])
      .select();

    if (fullError) {
      console.error('❌ Full structure test failed:', fullError.message);
      console.log('\n🔧 Structure needs to be fixed manually.');
      return;
    }

    console.log('✅ Full structure working!');
    
    // テストデータを削除
    await supabase
      .from('content_sources')
      .delete()
      .eq('url', fullTestSource.url);

    // 初期データを挿入
    const initialSources = [
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

    if (count === 0) {
      console.log('📥 Inserting initial data...');
      const { data: inserted, error: insertError } = await supabase
        .from('content_sources')
        .insert(initialSources)
        .select();

      if (insertError) {
        console.error('❌ Initial data insertion failed:', insertError.message);
      } else {
        console.log(`✅ Successfully inserted ${inserted.length} sources`);
      }
    } else {
      console.log('ℹ️  Skipping initial data insertion (existing data found)');
    }

    // 最終状態確認
    const { data: finalData, count: finalCount } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log('\n🎉 Setup verification complete!');
    console.log(`📊 Total sources: ${finalCount}`);
    
    if (finalData && finalData.length > 0) {
      console.log('📋 Sample sources:');
      finalData.slice(0, 3).forEach(source => {
        console.log(`- ${source.name} (${source.category})`);
      });
    }

    console.log('\n🚀 Admin interface ready:');
    console.log('http://localhost:3000/admin/sources');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();