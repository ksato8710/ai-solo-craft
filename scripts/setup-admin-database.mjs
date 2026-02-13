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

const TABLE_SCHEMA = `
-- 情報源管理テーブルの作成
CREATE TABLE IF NOT EXISTS content_sources (
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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_content_sources_category ON content_sources(category);
CREATE INDEX IF NOT EXISTS idx_content_sources_active ON content_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_content_sources_free ON content_sources(is_free);

-- 更新時間の自動更新
CREATE OR REPLACE FUNCTION update_content_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER IF NOT EXISTS update_content_sources_updated_at_trigger
  BEFORE UPDATE ON content_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_content_sources_updated_at();
`;

async function main() {
  loadProjectEnvFiles();
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('🔧 Setting up admin database...\n');

  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('contents')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      process.exit(1);
    }

    console.log('✅ Database connection successful');

    // Check if content_sources table exists
    const { data: sourcesData, error: sourcesError } = await supabase
      .from('content_sources')
      .select('id')
      .limit(1);

    if (sourcesError) {
      if (sourcesError.code === '42P01' || sourcesError.message.includes('does not exist')) {
        console.log('⚠️  content_sources table does not exist');
        console.log('\nPlease create the table manually in Supabase dashboard:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Execute the following SQL:');
        console.log('\n--- SQL TO EXECUTE ---');
        console.log(TABLE_SCHEMA);
        console.log('--- END SQL ---\n');
        console.log('3. After execution, run this script again');
        
        // Save SQL to file for easy access
        const sqlFile = path.join(ROOT, 'sql/create_content_sources_table.sql');
        if (!fs.existsSync(path.dirname(sqlFile))) {
          fs.mkdirSync(path.dirname(sqlFile), { recursive: true });
        }
        fs.writeFileSync(sqlFile, TABLE_SCHEMA);
        console.log(`📄 SQL saved to: ${sqlFile}`);
        
        return;
      } else {
        console.error('❌ Error accessing content_sources:', sourcesError.message);
        process.exit(1);
      }
    }

    console.log('✅ content_sources table exists');

    // Check table structure by attempting insert
    const testSource = {
      name: 'Test Source',
      url: 'https://example-test.com',
      category: 'test',
      quality_rating: 3,
      accessibility_rating: 3,
      is_free: true,
      is_active: false,
      description: 'Test source for validation'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('content_sources')
      .insert([testSource])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Table structure issue:', insertError.message);
      console.log('\nThe table exists but may have incorrect structure.');
      console.log('Please verify the table schema matches the expected structure.');
      return;
    }

    console.log('✅ Table structure validated');

    // Clean up test data
    await supabase
      .from('content_sources')
      .delete()
      .eq('id', insertData.id);

    console.log('🧹 Test data cleaned up');

    // Get current count
    const { data: countData, count } = await supabase
      .from('content_sources')
      .select('*', { count: 'exact' });

    console.log(`📊 Current sources count: ${count}`);

    if (count === 0) {
      console.log('\n💡 Next steps:');
      console.log('1. Access admin interface: http://localhost:3000/admin/sources');
      console.log('2. Click "初期データ投入" to add recommended sources');
      console.log('3. Start managing your content sources!');
    } else {
      console.log('\n📋 Existing sources found:');
      countData?.slice(0, 3).forEach(source => {
        console.log(`- ${source.name} (${source.category})`);
      });
      if (count > 3) {
        console.log(`... and ${count - 3} more`);
      }
      console.log('\n💡 Access admin interface: http://localhost:3000/admin/sources');
    }

    console.log('\n✅ Admin database setup complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();