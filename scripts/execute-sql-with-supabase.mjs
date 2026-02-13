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

// SQLクエリを個別ステートメントに分割して実行
async function executeSQLStatements(supabase, sqlText) {
  // BEGINとCOMMITを除去し、個別のステートメントに分割
  const cleanSQL = sqlText
    .replace(/BEGIN;/gi, '')
    .replace(/COMMIT;/gi, '')
    .trim();

  const statements = cleanSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*--/));

  console.log(`📋 Found ${statements.length} SQL statements to execute`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    console.log(`\n📝 [${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

    try {
      // PostgreSQLファンクション実行として試行
      const { data, error } = await supabase.rpc('exec_sql', { 
        query: statement 
      });

      if (error) {
        // RPC が使えない場合、直接的な操作に切り替え
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('   ⚠️  RPC exec_sql not available, trying alternative methods...');
          
          // DROPやCREATEのような構造変更は個別処理が必要
          if (statement.toUpperCase().includes('DROP TABLE')) {
            console.log('   🗑️  Attempting to drop table...');
            throw new Error('Direct DROP not supported via client');
          } else if (statement.toUpperCase().includes('CREATE TABLE')) {
            console.log('   🔨 Table creation requires manual execution');
            throw new Error('Direct CREATE TABLE not supported via client');
          } else if (statement.toUpperCase().includes('INSERT INTO content_sources')) {
            // INSERTは通常のSupabaseクライアント操作で実行
            console.log('   📥 Will handle INSERT operations separately');
            continue;
          }
        }
        throw error;
      }

      console.log('   ✅ Success');
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
      
      // クリティカルエラーの場合は中止
      if (statement.toUpperCase().includes('CREATE TABLE') && 
          error.message.includes('already exists') === false) {
        console.error('❌ Critical table creation failed, aborting...');
        throw error;
      }
    }
  }

  return { successCount, errorCount, totalStatements: statements.length };
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

  console.log('🚀 Executing SQL with Supabase client...\n');
  console.log(`📍 Project: ${url.split('//')[1].split('.')[0]}`);

  try {
    // SQLファイルを読み込み
    const sqlFile = '/tmp/content_sources_setup.sql';
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    console.log(`📄 Loaded SQL file (${sqlContent.length} characters)`);

    // SQL実行を試行
    const result = await executeSQLStatements(supabase, sqlContent);
    
    if (result.errorCount > 0) {
      console.log('\n⚠️  Some statements failed, trying direct data insertion...');
      
      // 初期データを直接挿入
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

      console.log('📥 Attempting to insert initial data directly...');
      const { data: insertedData, error: insertError } = await supabase
        .from('content_sources')
        .upsert(initialSources, { onConflict: 'url' })
        .select();

      if (insertError) {
        console.error('❌ Data insertion failed:', insertError.message);
        
        if (insertError.code === '42P01') {
          console.log('\n🔨 Table does not exist. Manual table creation required.');
          console.log('Please execute this SQL in Supabase Dashboard > SQL Editor:');
          console.log('\n--- COPY THIS SQL ---');
          console.log(sqlContent);
          console.log('\n--- END SQL ---');
          return;
        }
        throw insertError;
      }

      console.log(`✅ Successfully inserted ${insertedData?.length || 0} sources via client`);
    }

    // 最終確認
    const { data: finalData, count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log('\n🎉 SQL Execution Complete!');
    console.log(`📊 Total sources in database: ${count || 0}`);
    
    if (finalData && finalData.length > 0) {
      console.log('\n📋 Sample sources:');
      finalData.slice(0, 3).forEach((source, i) => {
        console.log(`${i + 1}. ${source.name} (${source.category}) - ${source.quality_rating}⭐`);
      });
      
      const activeCount = finalData.filter(s => s.is_active).length;
      console.log(`\n📊 Active sources: ${activeCount}/${finalData.length}`);
    }

    console.log('\n🚀 Admin interface ready:');
    console.log('- Local: http://localhost:3000/admin/sources');
    console.log('- Production: https://ai.essential-navigator.com/admin/sources');
    console.log('\nRun `npm run admin:check` to verify the setup.');

  } catch (error) {
    console.error('\n❌ SQL execution failed:', error.message);
    
    console.log('\n🔧 Alternative approach:');
    console.log('1. Copy the SQL from /tmp/content_sources_setup.sql');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Paste and execute the SQL manually');
    
    process.exit(1);
  }
}

main();