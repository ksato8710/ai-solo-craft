#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// .env.local読み込み
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    }
  })
} catch (error) {
  console.warn('Warning: .env.local not found, using system environment variables')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkContentsSchema() {
  console.log('📊 contentsテーブルスキーマ確認中...')
  
  try {
    // PostgreSQLのinformation_schemaから取得
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'contents'
          ORDER BY ordinal_position
        `
      })

    if (error) {
      console.error('スキーマ取得エラー:', error)
      return
    }

    console.log('\n📋 contentsテーブル構造:')
    console.log('=====================================')
    data.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable}`)
    })

  } catch (error) {
    console.error('実行エラー:', error)
  }
}

checkContentsSchema()