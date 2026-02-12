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

// 最小限の情報源データ（既存カラムに合わせて）
const basicSources = [
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    category: 'tech-community',
    description: 'プログラマー・起業家コミュニティによる技術ニュースのランキングサイト'
  },
  {
    name: 'GitHub Trending', 
    url: 'https://github.com/trending',
    category: 'dev-tools',
    description: 'GitHubで注目されているオープンソースプロジェクトのトレンド'
  },
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com', 
    category: 'startup',
    description: '新しいプロダクト・サービスの投稿・発見プラットフォーム'
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    category: 'startup', 
    description: 'スタートアップ・投資・テック業界のニュースメディア'
  },
  {
    name: 'Indie Hackers',
    url: 'https://www.indiehackers.com',
    category: 'indie-business',
    description: '独立開発者・ソロ起業家のコミュニティ'
  }
];

async function main() {
  loadProjectEnvFiles();
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('🔧 Inserting basic content sources...\n');

  try {
    // Try insert with minimal data first
    console.log('📝 Attempting to insert basic sources...');
    
    for (const source of basicSources) {
      const { data, error } = await supabase
        .from('content_sources')
        .insert([source])
        .select();

      if (error) {
        console.log(`❌ Failed to insert ${source.name}:`, error.message);
      } else {
        console.log(`✅ Inserted: ${source.name}`);
      }
    }

    // Display all sources
    const { data: allSources, error: selectError } = await supabase
      .from('content_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectError) {
      console.log('❌ Error fetching sources:', selectError.message);
    } else {
      console.log(`\n📋 Current content sources (${allSources.length}):`);
      allSources.forEach(source => {
        console.log(`- ${source.name} (${source.category || 'no category'})`);
        console.log(`  🔗 ${source.url}`);
        if (source.description) {
          console.log(`  📝 ${source.description}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

main().catch(console.error);