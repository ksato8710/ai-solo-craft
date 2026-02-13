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

  console.log('🔧 Inserting minimal data with existing table structure...\n');

  try {
    // 最小限の必須フィールドのみでテスト
    const minimalSources = [
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com'
      },
      {
        name: 'GitHub Trending', 
        url: 'https://github.com/trending'
      }
    ];

    console.log('📝 Testing minimal field insertion...');
    
    for (const source of minimalSources) {
      try {
        const { data: result, error } = await supabase
          .from('content_sources')
          .insert([source])
          .select();

        if (error) {
          console.error(`❌ ${source.name}:`, error.message);
        } else {
          console.log(`✅ ${source.name} inserted successfully`);
        }
      } catch (error) {
        console.error(`❌ ${source.name} failed:`, error.message);
      }
    }

    // 現在のデータ状況を確認
    const { data: currentData, count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log(`\n📊 Current table status: ${count} records`);
    
    if (currentData && currentData.length > 0) {
      console.log('\n📋 Table structure from actual data:');
      const sampleRecord = currentData[0];
      console.log('Available columns:', Object.keys(sampleRecord));
      
      console.log('\n📋 Current sources:');
      currentData.forEach((source, i) => {
        console.log(`${i + 1}. ${source.name || 'No name'}: ${source.url || 'No URL'}`);
      });
    }

    console.log('\n🔧 Manual table creation required!');
    console.log('\nTo complete the setup, run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('\n--- REQUIRED SQL ---');
    
    const requiredSQL = `
-- Drop existing incomplete table
DROP TABLE IF EXISTS content_sources CASCADE;

-- Create complete content_sources table
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'uncategorized',
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5) DEFAULT 3,
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5) DEFAULT 3,
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_sources_category ON content_sources(category);
CREATE INDEX idx_content_sources_active ON content_sources(is_active);
CREATE INDEX idx_content_sources_free ON content_sources(is_free);

-- Insert initial data
INSERT INTO content_sources (name, url, category, quality_rating, accessibility_rating, is_free, is_active, description) VALUES
('Hacker News', 'https://news.ycombinator.com', 'tech-community', 4, 5, true, true, 'プログラマー・起業家コミュニティによる技術ニュースのランキングサイト'),
('GitHub Trending', 'https://github.com/trending', 'dev-tools', 4, 4, true, true, 'GitHubで注目されているオープンソースプロジェクトのトレンド'),
('Indie Hackers', 'https://www.indiehackers.com', 'indie-business', 4, 4, true, true, '独立開発者・ソロ起業家のコミュニティ'),
('Y Combinator News', 'https://www.ycombinator.com/blog', 'startup', 5, 4, true, true, 'YCによる起業家向けアドバイス・業界動向'),
('TechCrunch', 'https://techcrunch.com', 'startup', 4, 3, true, true, 'スタートアップ・投資・テック業界のニュースメディア'),
('Stack Overflow Blog', 'https://stackoverflow.blog', 'dev-knowledge', 4, 4, true, true, 'プログラマーQ&Aサイトによる開発動向・調査レポート'),
('Ars Technica', 'https://arstechnica.com', 'tech-analysis', 5, 3, true, true, '技術的に詳細で信頼性の高い解説記事'),
('Product Hunt', 'https://www.producthunt.com', 'startup', 3, 4, true, true, '新しいプロダクト・サービスの投稿・発見プラットフォーム');

-- Verification query
SELECT 
  'Setup completed!' as status,
  COUNT(*) as total_sources,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_sources
FROM content_sources;
`;

    console.log(requiredSQL);
    console.log('\n--- END SQL ---');
    
    console.log('\n📋 Steps to complete:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your AI Solo Builder project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click RUN');
    console.log('6. Access admin interface: http://localhost:3000/admin/sources');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();