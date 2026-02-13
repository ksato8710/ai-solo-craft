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

async function executeSQL(supabase, sql, description) {
  console.log(`📝 Executing: ${description}`);
  try {
    // SQLを分割して実行
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      console.log(`   Running: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { 
        query: statement + ';' 
      });
      
      if (error) {
        // rpc が使えない場合は、直接実行を試みる
        throw error;
      }
    }
    console.log(`   ✅ ${description} completed`);
  } catch (error) {
    console.error(`   ❌ ${description} failed:`, error.message);
    throw error;
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

  console.log('🚀 Executing admin SQL setup...\n');

  try {
    // 1. 既存テーブルを削除（安全のためバックアップ確認）
    console.log('🔍 Checking existing content_sources table...');
    const { data: existingData, error: checkError } = await supabase
      .from('content_sources')
      .select('*');

    if (!checkError && existingData && existingData.length > 0) {
      console.log(`⚠️  Found ${existingData.length} existing records`);
      console.log('Creating backup...');
      
      // バックアップデータを保存
      const backupFile = path.join(ROOT, 'backup_content_sources.json');
      fs.writeFileSync(backupFile, JSON.stringify(existingData, null, 2));
      console.log(`📄 Backup saved to: ${backupFile}`);
    }

    // 2. テーブルをドロップして再作成
    const dropSQL = 'DROP TABLE IF EXISTS content_sources';
    
    // rpcが使えない場合は、SQLクエリを直接的に試す
    console.log('🗑️  Dropping existing table...');
    const { error: dropError } = await supabase.rpc('exec_sql', { query: dropSQL });
    
    if (dropError) {
      console.log('⚠️  RPC method not available, using alternative approach...');
      
      // 代替手段: テーブルの構造を直接変更
      try {
        // 存在しないカラムを追加
        const alterSQL = `
          ALTER TABLE content_sources 
          ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
          ADD COLUMN IF NOT EXISTS accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
          ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT true,
          ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false
        `;
        
        const { error: alterError } = await supabase.rpc('exec_sql', { query: alterSQL });
        if (alterError) {
          throw new Error('Could not alter table structure: ' + alterError.message);
        }
        console.log('✅ Table structure updated');
      } catch (error) {
        console.error('❌ Failed to update table structure:', error.message);
        throw error;
      }
    } else {
      console.log('✅ Table dropped successfully');
      
      // 3. 新しいテーブルを作成
      const createSQL = `
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
        )
      `;

      await executeSQL(supabase, createSQL, 'Table creation');

      // 4. インデックスを作成
      const indexSQL = `
        CREATE INDEX idx_content_sources_category ON content_sources(category);
        CREATE INDEX idx_content_sources_active ON content_sources(is_active);
        CREATE INDEX idx_content_sources_free ON content_sources(is_free)
      `;

      await executeSQL(supabase, indexSQL, 'Index creation');

      // 5. トリガー関数を作成
      const triggerSQL = `
        CREATE OR REPLACE FUNCTION update_content_sources_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language plpgsql;

        CREATE TRIGGER update_content_sources_updated_at_trigger
          BEFORE UPDATE ON content_sources
          FOR EACH ROW
          EXECUTE FUNCTION update_content_sources_updated_at()
      `;

      await executeSQL(supabase, triggerSQL, 'Trigger setup');
    }

    // 6. テーブル構造を確認
    const { data: testData, error: testError } = await supabase
      .from('content_sources')
      .select('*')
      .limit(1);

    if (testError) {
      throw new Error('Table verification failed: ' + testError.message);
    }

    console.log('✅ Table structure verified');

    // 7. 初期データを投入
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
        description: '独立開発者・ソロ起業家のコミュニティ。収益化事例・運営ノウハウ'
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

    console.log('📥 Inserting initial data...');
    const { data: insertedData, error: insertError } = await supabase
      .from('content_sources')
      .insert(initialSources)
      .select();

    if (insertError) {
      throw new Error('Initial data insertion failed: ' + insertError.message);
    }

    console.log(`✅ ${insertedData.length} initial sources inserted`);

    // 8. 最終確認
    const { data: finalData, count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log('\n🎉 Setup completed successfully!');
    console.log(`📊 Total sources: ${count}`);
    
    if (finalData && finalData.length > 0) {
      console.log('\n📋 Sample sources:');
      finalData.slice(0, 3).forEach(source => {
        console.log(`- ${source.name} (${source.category}) - Quality: ${source.quality_rating}/5`);
      });
    }

    console.log('\n🚀 Next steps:');
    console.log('1. Access admin interface: http://localhost:3000/admin/sources');
    console.log('2. Manage your content sources');
    console.log('3. Start building better content!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check Supabase credentials');
    console.log('2. Verify database permissions');
    console.log('3. Try manual SQL execution in Supabase dashboard');
    process.exit(1);
  }
}

main();