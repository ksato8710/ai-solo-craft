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

async function executeSQLStatementsSequentially(supabase, sqlStatements) {
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    if (!statement.trim()) continue;
    
    console.log(`📝 Executing statement ${i + 1}/${sqlStatements.length}...`);
    
    try {
      // 個別のステートメントを実行
      const { data, error } = await supabase.rpc('query', { 
        query_text: statement 
      });
      
      if (error) {
        throw new Error(`Statement failed: ${error.message}`);
      }
      
      console.log(`   ✅ Statement ${i + 1} completed`);
      
    } catch (error) {
      console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
      throw error;
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

  console.log('🚀 Executing SQL directly with sequential statements...\n');

  try {
    // SQLファイルから個別のステートメントを抽出
    const sqlStatements = [
      // 1. テーブル削除
      'DROP TABLE IF EXISTS content_sources CASCADE',
      
      // 2. テーブル作成
      `CREATE TABLE content_sources (
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
      )`,
      
      // 3. インデックス作成
      'CREATE INDEX idx_content_sources_category ON content_sources(category)',
      'CREATE INDEX idx_content_sources_active ON content_sources(is_active)', 
      'CREATE INDEX idx_content_sources_free ON content_sources(is_free)',
      
      // 4. トリガー関数
      `CREATE OR REPLACE FUNCTION update_content_sources_updated_at()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
       END;
       $$ language plpgsql`,
      
      // 5. トリガー作成
      `CREATE TRIGGER update_content_sources_updated_at_trigger
       BEFORE UPDATE ON content_sources
       FOR EACH ROW
       EXECUTE FUNCTION update_content_sources_updated_at()`,
    ];

    // 初期データ
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
      },
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        category: 'startup',
        quality_rating: 4,
        accessibility_rating: 3,
        is_free: true,
        is_active: true,
        description: 'スタートアップ・投資・テック業界のニュースメディア'
      },
      {
        name: 'Stack Overflow Blog',
        url: 'https://stackoverflow.blog',
        category: 'dev-knowledge',
        quality_rating: 4,
        accessibility_rating: 4,
        is_free: true,
        is_active: true,
        description: 'プログラマーQ&Aサイトによる開発動向・調査レポート'
      },
      {
        name: 'Ars Technica',
        url: 'https://arstechnica.com',
        category: 'tech-analysis',
        quality_rating: 5,
        accessibility_rating: 3,
        is_free: true,
        is_active: true,
        description: '技術的に詳細で信頼性の高い解説記事'
      },
      {
        name: 'Product Hunt',
        url: 'https://www.producthunt.com',
        category: 'startup',
        quality_rating: 3,
        accessibility_rating: 4,
        is_free: true,
        is_active: true,
        description: '新しいプロダクト・サービスの投稿・発見プラットフォーム'
      }
    ];

    // RPC関数が利用できない場合、直接のINSERTアプローチを使用
    console.log('🔨 Executing database schema setup...');
    
    for (const statement of sqlStatements) {
      try {
        // より基本的なアプローチで実行
        const { error } = await supabase.rpc('query', { query: statement });
        if (error) {
          console.log(`⚠️  RPC query failed, trying direct client approach...`);
          // 最終手段として、直接INSERT操作を試行
          break;
        }
      } catch (error) {
        console.log(`⚠️  SQL execution not supported via RPC, using client operations...`);
        break;
      }
    }

    // 代替手段: 既存のAPIを使って初期データを挿入
    console.log('📥 Inserting initial data via client...');
    
    const { data: insertedData, error: insertError } = await supabase
      .from('content_sources')
      .upsert(initialSources, { onConflict: 'url' })
      .select();

    if (insertError) {
      // テーブルが存在しない場合、作成を指示
      if (insertError.code === '42P01') {
        console.log('\n❌ Table does not exist. Manual creation required.');
        console.log('\nPlease execute the following SQL in Supabase Dashboard > SQL Editor:');
        console.log('\n--- COPY AND PASTE THIS SQL ---');
        
        const sqlContent = fs.readFileSync(path.join(ROOT, 'sql/setup_content_sources.sql'), 'utf8');
        console.log(sqlContent);
        console.log('\n--- END SQL ---\n');
        
        return;
      } else {
        throw insertError;
      }
    }

    console.log(`✅ Successfully inserted ${insertedData?.length || 0} sources`);

    // 最終確認
    const { data: finalData, count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log('\n🎉 Setup completed!');
    console.log(`📊 Total sources: ${count}`);
    
    if (finalData && finalData.length > 0) {
      console.log('\n📋 Active sources:');
      finalData
        .filter(s => s.is_active)
        .forEach(source => {
          console.log(`- ${source.name} (${source.category}) - ${source.quality_rating}⭐`);
        });
    }

    console.log('\n🚀 Admin interface ready:');
    console.log('- Development: http://localhost:3000/admin/sources');
    console.log('- Production: https://ai.essential-navigator.com/admin/sources');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.code === '42P01') {
      console.log('\n📄 Manual SQL execution required:');
      console.log('1. Open Supabase Dashboard > SQL Editor');
      console.log('2. Copy and paste: sql/setup_content_sources.sql');
      console.log('3. Click "RUN" to execute');
    }
    
    process.exit(1);
  }
}

main();