#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ENV_FILES = ['.env.local', '.env'];

function die(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function stripOuterQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return false;

  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    const rawValue = normalized.slice(separatorIndex + 1).trim();
    const value = stripOuterQuotes(rawValue).replace(/\\n/g, '\n');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return true;
}

function loadProjectEnvFiles() {
  const loaded = [];
  for (const envFile of ENV_FILES) {
    if (loadEnvFile(envFile)) loaded.push(envFile);
  }
  return loaded;
}

async function main() {
  const loadedEnvFiles = loadProjectEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    die(`Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY). Loaded env files: ${loadedEnvFiles.join(', ') || 'none'}`);
  }

  console.log('🔧 Creating news_sources table...');

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Create news_sources table
  const createTableSQL = `
    -- 情報源管理テーブルの作成
    CREATE TABLE IF NOT EXISTS news_sources (
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

    -- インデックス追加
    CREATE INDEX IF NOT EXISTS idx_news_sources_category ON news_sources(category);
    CREATE INDEX IF NOT EXISTS idx_news_sources_active ON news_sources(is_active);
    CREATE INDEX IF NOT EXISTS idx_news_sources_free ON news_sources(is_free);

    -- RLS (Row Level Security) 有効化
    ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;

    -- 基本ポリシー: 読み取りは公開、書き込みは認証必要
    DROP POLICY IF EXISTS "Allow public read access on news_sources" ON news_sources;
    CREATE POLICY "Allow public read access on news_sources" ON news_sources
      FOR SELECT USING (true);

    -- 更新時間の自動更新用トリガー
    CREATE OR REPLACE FUNCTION update_news_sources_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language plpgsql;

    DROP TRIGGER IF EXISTS update_news_sources_updated_at_trigger ON news_sources;
    CREATE TRIGGER update_news_sources_updated_at_trigger
      BEFORE UPDATE ON news_sources
      FOR EACH ROW
      EXECUTE FUNCTION update_news_sources_updated_at();
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
    if (error) {
      // rpcが使えない場合は直接SQLを実行
      console.log('RPC method not available, trying direct SQL execution...');
      
      // PostgreSQLクライアント経由で実行を試みる (この部分は環境依存)
      console.log('⚠️  Direct SQL execution may require manual setup.');
      console.log('Please execute the following SQL in your Supabase dashboard:');
      console.log('\n--- SQL TO EXECUTE ---');
      console.log(createTableSQL);
      console.log('--- END SQL ---\n');
      
      die('Could not execute SQL automatically. Please run the SQL manually in Supabase dashboard.');
    }
    
    console.log('✅ news_sources table created successfully!');
    
  } catch (error) {
    console.error('Error creating table:', error);
    console.log('Please execute the following SQL manually in Supabase dashboard:');
    console.log('\n--- SQL TO EXECUTE ---');
    console.log(createTableSQL);
    console.log('--- END SQL ---\n');
    throw error;
  }
}

main().catch((error) => {
  console.error('\n❌ create-news-sources-table failed');
  console.error(error);
  process.exit(1);
});