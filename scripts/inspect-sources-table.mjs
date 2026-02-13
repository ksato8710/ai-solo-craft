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

async function inspectSourcesTable() {
  console.log('📊 sourcesテーブル構造確認中...')
  
  try {
    // 1件取得してフィールド確認
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .limit(1)

    if (error) {
      console.error('データ取得エラー:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('\n📋 sourcesテーブルフィールド一覧:')
      console.log('=====================================')
      const record = data[0]
      Object.keys(record).forEach(key => {
        console.log(`${key.padEnd(25)} : ${typeof record[key]} | ${record[key] === null ? 'null' : String(record[key]).substring(0, 50)}`)
      })
    } else {
      console.log('データが見つかりません')
    }

  } catch (error) {
    console.error('実行エラー:', error)
  }
}

inspectSourcesTable()