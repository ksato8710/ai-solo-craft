#!/usr/bin/env node

/**
 * Step 3: ソース定期メンテナンスシステム
 * 
 * 機能:
 * 1. ソース信頼度の月次更新（利用頻度・成功率ベース）
 * 2. 新規ソース自動発見・追加
 * 3. 非アクティブソースの検出
 * 4. レポート生成
 */

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

/**
 * 1. ソース利用状況分析・信頼度更新
 */
async function updateSourceCredibility() {
  console.log('\n🔄 ソース信頼度更新中...')
  
  try {
    // 過去30日の記事とソース利用状況取得
    const { data: usageStats, error: usageError } = await supabase
      .from('contents')
      .select(`
        primary_source_id,
        sources!inner(name, domain, source_type, credibility_score),
        created_at
      `)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .not('primary_source_id', 'is', null)

    if (usageError) {
      console.error('利用状況取得エラー:', usageError)
      return
    }

    // ソース別利用回数集計
    const sourceUsage = {}
    usageStats.forEach(article => {
      const sourceId = article.primary_source_id
      if (!sourceUsage[sourceId]) {
        sourceUsage[sourceId] = {
          source: article.sources,
          count: 0,
          recentUsage: []
        }
      }
      sourceUsage[sourceId].count++
      sourceUsage[sourceId].recentUsage.push(article.created_at)
    })

    // 信頼度スコア更新ロジック
    const updates = []
    for (const [sourceId, usage] of Object.entries(sourceUsage)) {
      const source = usage.source
      let newScore = source.credibility_score
      
      // 利用頻度による調整
      if (usage.count >= 10) {
        newScore = Math.min(10, newScore + 0.5) // 高頻度利用で+0.5
      } else if (usage.count >= 5) {
        newScore = Math.min(10, newScore + 0.2) // 中頻度利用で+0.2
      } else if (usage.count === 0) {
        newScore = Math.max(1, newScore - 0.3) // 未利用で-0.3
      }

      // ソースタイプによる基準調整
      if (source.source_type === 'primary' && newScore < 7) {
        newScore = 7 // 一次ソースは最低7点保証
      }

      if (newScore !== source.credibility_score) {
        updates.push({
          id: sourceId,
          oldScore: source.credibility_score,
          newScore: Math.round(newScore * 10) / 10, // 小数点1桁
          usage: usage.count
        })
      }
    }

    // DB更新実行
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('sources')
        .update({ credibility_score: update.newScore })
        .eq('id', update.id)

      if (!updateError) {
        console.log(`✅ ${update.id}: ${update.oldScore} → ${update.newScore} (利用${update.usage}回)`)
      }
    }

    console.log(`✅ 信頼度更新完了: ${updates.length}件`)
    return updates

  } catch (error) {
    console.error('信頼度更新エラー:', error)
    return []
  }
}

/**
 * 2. 新規ソース自動発見
 */
async function discoverNewSources() {
  console.log('\n🔍 新規ソース発見中...')
  
  try {
    // 過去7日の記事で未分類のソースURL抽出
    const { data: articles, error } = await supabase
      .from('contents')
      .select('slug, body_markdown')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('body_markdown', 'is', null)

    if (error) {
      console.error('記事取得エラー:', error)
      return []
    }

    // 既存ソース一覧取得
    const { data: existingSources } = await supabase
      .from('sources')
      .select('domain')

    const existingDomains = new Set(existingSources?.map(s => s.domain) || [])
    
    // 新規ドメイン発見（Markdownからリンク抽出）
    const newDomains = new Set()
    articles.forEach(article => {
      if (article.body_markdown) {
        // Markdownリンク抽出: [text](url) または直接URL
        const linkRegex = /\[([^\]]*)\]\(([^)]+)\)|https?:\/\/[^\s)]+/g
        let match
        while ((match = linkRegex.exec(article.body_markdown)) !== null) {
          const url = match[2] || match[0] // [text](url) or direct URL
          try {
            const domain = new URL(url).hostname.replace('www.', '')
            if (!existingDomains.has(domain) && !newDomains.has(domain)) {
              newDomains.add(domain)
            }
          } catch (e) {
            // 無効なURL無視
          }
        }
      }
    })

    // 新規ソース自動分類・追加
    const newSources = []
    for (const domain of newDomains) {
      const sourceType = classifySourceType(domain)
      const credibilityScore = calculateInitialCredibility(domain, sourceType)
      
      const newSource = {
        name: formatSourceName(domain),
        domain: domain,
        url: `https://${domain}`,
        source_type: sourceType,
        credibility_score: credibilityScore,
        verification_level: sourceType === 'primary' ? 'official' : 'editorial',
        description: `Auto-discovered ${sourceType} source`,
        created_at: new Date().toISOString()
      }

      // DB追加
      const { data, error: insertError } = await supabase
        .from('sources')
        .insert(newSource)
        .select()

      if (!insertError) {
        newSources.push(newSource)
        console.log(`✅ 新規ソース追加: ${newSource.name} (${sourceType}, 信頼度${credibilityScore})`)
      } else {
        console.log(`❌ 追加失敗: ${newSource.name} - ${insertError.message}`)
      }
    }

    console.log(`✅ 新規ソース発見完了: ${newSources.length}件`)
    return newSources

  } catch (error) {
    console.error('新規ソース発見エラー:', error)
    return []
  }
}

/**
 * ソースタイプ自動分類
 */
function classifySourceType(domain) {
  // 一次ソース（公式ブログ・文書）
  const primaryPatterns = [
    'blog.openai.com', 'anthropic.com', 'blog.anthropic.com',
    'developers.google.com', 'ai.google.com', 'blog.google.com',
    'engineering.fb.com', 'about.fb.com',
    'blogs.microsoft.com', 'azure.microsoft.com',
    'research.nvidia.com', 'developer.nvidia.com'
  ]
  
  // 二次ソース（技術メディア）
  const secondaryPatterns = [
    'techcrunch.com', 'arstechnica.com', 'theverge.com',
    'wired.com', 'venturebeat.com', 'reuters.com',
    'bloomberg.com', 'wsj.com'
  ]

  if (primaryPatterns.some(p => domain.includes(p))) {
    return 'primary'
  } else if (secondaryPatterns.some(p => domain.includes(p))) {
    return 'secondary'
  } else {
    return 'tertiary'
  }
}

/**
 * 初期信頼度スコア算出
 */
function calculateInitialCredibility(domain, sourceType) {
  let baseScore
  switch (sourceType) {
    case 'primary': baseScore = 9; break
    case 'secondary': baseScore = 7; break
    case 'tertiary': baseScore = 5; break
    default: baseScore = 5
  }

  // ドメイン特別調整
  if (domain.includes('github.com')) baseScore = Math.max(baseScore, 8)
  if (domain.includes('arxiv.org')) baseScore = Math.max(baseScore, 9)
  if (domain.includes('reddit.com')) baseScore = 6
  if (domain.includes('twitter.com') || domain.includes('x.com')) baseScore = 5

  return baseScore
}

/**
 * ソース名フォーマット
 */
function formatSourceName(domain) {
  const nameMap = {
    'techcrunch.com': 'TechCrunch',
    'theverge.com': 'The Verge',
    'arstechnica.com': 'Ars Technica',
    'venturebeat.com': 'VentureBeat',
    'github.com': 'GitHub',
    'arxiv.org': 'arXiv',
    'reddit.com': 'Reddit'
  }
  
  return nameMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1)
}

/**
 * 3. 非アクティブソース検出
 */
async function detectInactiveSources() {
  console.log('\n📊 非アクティブソース検出中...')
  
  try {
    // 過去90日間利用されていないソース検出
    const { data: inactiveSources, error } = await supabase
      .from('sources')
      .select(`
        id, name, domain, source_type,
        contents!left(primary_source_id, created_at)
      `)
      .filter('contents.created_at', 'gte', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('非アクティブソース検出エラー:', error)
      return []
    }

    const inactive = inactiveSources.filter(source => 
      !source.contents || source.contents.length === 0
    )

    console.log(`📊 90日間未利用ソース: ${inactive.length}件`)
    inactive.forEach(source => {
      console.log(`  - ${source.name} (${source.domain})`)
    })

    return inactive

  } catch (error) {
    console.error('非アクティブソース検出エラー:', error)
    return []
  }
}

/**
 * 4. メンテナンスレポート生成
 */
async function generateMaintenanceReport(credibilityUpdates, newSources, inactiveSources) {
  const report = {
    timestamp: new Date().toISOString(),
    credibility_updates: credibilityUpdates.length,
    new_sources_added: newSources.length,
    inactive_sources_found: inactiveSources.length,
    details: {
      credibility_updates: credibilityUpdates,
      new_sources: newSources.map(s => ({ name: s.name, domain: s.domain, type: s.source_type })),
      inactive_sources: inactiveSources.map(s => ({ name: s.name, domain: s.domain }))
    }
  }

  // レポート保存
  const reportPath = `maintenance-report-${new Date().toISOString().split('T')[0]}.json`
  await import('fs').then(fs => 
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  )

  console.log('\n📋 メンテナンスレポート:')
  console.log(`📅 実行時刻: ${report.timestamp}`)
  console.log(`🔄 信頼度更新: ${report.credibility_updates}件`)
  console.log(`🆕 新規ソース: ${report.new_sources_added}件`)
  console.log(`💤 非アクティブ: ${report.inactive_sources_found}件`)
  console.log(`📄 詳細レポート: ${reportPath}`)

  return report
}

/**
 * メイン実行
 */
async function main() {
  console.log('🛠️  ソース定期メンテナンス開始')
  console.log('=====================================')

  try {
    const credibilityUpdates = await updateSourceCredibility()
    const newSources = await discoverNewSources()
    const inactiveSources = await detectInactiveSources()
    const report = await generateMaintenanceReport(credibilityUpdates, newSources, inactiveSources)

    console.log('\n✅ 定期メンテナンス完了!')
    return report

  } catch (error) {
    console.error('メンテナンス実行エラー:', error)
    process.exit(1)
  }
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as sourceMaintenanceMain }