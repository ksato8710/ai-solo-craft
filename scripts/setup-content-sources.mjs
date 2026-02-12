#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ENV_FILES = ['.env.local', '.env'];

function loadProjectEnvFiles() {
  for (const envFile of ENV_FILES) {
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

// 想定される情報源のマスターデータ
const informationSources = [
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    category: 'tech-community',
    quality_rating: 4,
    accessibility_rating: 5,
    is_free: true,
    is_active: true,
    description: 'プログラマー・起業家コミュニティによる技術ニュースのランキングサイト。質の高い議論と一次ソースが特徴'
  },
  {
    name: 'GitHub Trending',
    url: 'https://github.com/trending',
    category: 'dev-tools',
    quality_rating: 4,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: 'GitHubで注目されているオープンソースプロジェクトのトレンド。開発者による実際の利用が反映'
  },
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com',
    category: 'startup',
    quality_rating: 3,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: '新しいプロダクト・サービスの投稿・発見プラットフォーム。早期アダプターによる評価'
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    category: 'startup',
    quality_rating: 4,
    accessibility_rating: 3,
    is_free: true,
    is_active: true,
    description: 'スタートアップ・投資・テック業界のニュースメディア。資金調達・企業動向の速報に強み'
  },
  {
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    category: 'tech-analysis',
    quality_rating: 5,
    accessibility_rating: 3,
    is_free: true,
    is_active: true,
    description: '技術的に詳細で信頼性の高い解説記事。エンジニア向けの深い分析'
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com',
    category: 'consumer-tech',
    quality_rating: 4,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: 'コンシューマー向け技術製品・サービスのニュース・レビュー'
  },
  {
    name: 'Y Combinator News',
    url: 'https://www.ycombinator.com/blog',
    category: 'startup',
    quality_rating: 5,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: 'YCによる起業家向けアドバイス・業界動向。実践的なスタートアップノウハウ'
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
    name: 'Dev.to',
    url: 'https://dev.to',
    category: 'dev-knowledge',
    quality_rating: 3,
    accessibility_rating: 5,
    is_free: true,
    is_active: true,
    description: '開発者コミュニティによる技術記事・体験談の投稿サイト'
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
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com',
    category: 'tech-research',
    quality_rating: 5,
    accessibility_rating: 2,
    is_free: false,
    is_active: false,
    description: 'MITによる先端技術・AI研究の解説。有料記事が多い'
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com',
    category: 'tech-culture',
    quality_rating: 4,
    accessibility_rating: 2,
    is_free: false,
    is_active: false,
    description: 'テクノロジーと文化の関係を扱う雑誌。有料記事が多い'
  },
  {
    name: 'Fast Company',
    url: 'https://www.fastcompany.com',
    category: 'business-innovation',
    quality_rating: 4,
    accessibility_rating: 3,
    is_free: true,
    is_active: true,
    description: 'イノベーション・デザイン・ビジネス戦略の記事'
  },
  {
    name: 'VentureBeat',
    url: 'https://venturebeat.com',
    category: 'startup',
    quality_rating: 3,
    accessibility_rating: 4,
    is_free: true,
    is_active: true,
    description: 'AI・ゲーム・モバイル技術のニュース'
  },
  {
    name: 'AngelList (Wellfound)',
    url: 'https://wellfound.com',
    category: 'startup',
    quality_rating: 3,
    accessibility_rating: 3,
    is_free: true,
    is_active: true,
    description: 'スタートアップの求人・資金調達情報'
  }
];

async function main() {
  loadProjectEnvFiles();
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('🔧 Setting up content_sources table with comprehensive data...\n');

  // 無料メディア限定での推奨ソース
  const freeSourcesForActiveUse = informationSources
    .filter(source => source.is_free && source.is_active)
    .sort((a, b) => b.quality_rating - a.quality_rating);

  console.log('📋 Recommended free sources for immediate use:');
  freeSourcesForActiveUse.forEach(source => {
    console.log(`${source.quality_rating}⭐ ${source.name} (${source.category})`);
    console.log(`   📝 ${source.description}`);
    console.log(`   🔗 ${source.url}\n`);
  });

  // まずテーブル構造をチェック
  const { data: testData, error: testError } = await supabase
    .from('content_sources')
    .select('*')
    .limit(1);

  if (testError) {
    console.log('❌ Error accessing content_sources:', testError.message);
    console.log('Please ensure the table exists with appropriate columns');
    return;
  }

  // 全データを挿入
  console.log('📝 Inserting information sources data...');
  
  const { data: insertedData, error: insertError } = await supabase
    .from('content_sources')
    .upsert(informationSources, {
      onConflict: 'url'
    })
    .select();

  if (insertError) {
    console.log('❌ Error inserting data:', insertError.message);
    console.log('\nIf this is due to missing columns, please create the table with:');
    console.log(`
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
);
`);
    return;
  }

  console.log(`✅ Successfully upserted ${informationSources.length} information sources`);
  
  // 統計情報を表示
  const { data: allSources } = await supabase
    .from('content_sources')
    .select('*')
    .order('quality_rating', { ascending: false });

  if (allSources) {
    const stats = {
      total: allSources.length,
      active: allSources.filter(s => s.is_active).length,
      free: allSources.filter(s => s.is_free).length,
      freeAndActive: allSources.filter(s => s.is_free && s.is_active).length,
      avgQuality: allSources.reduce((sum, s) => sum + s.quality_rating, 0) / allSources.length,
      categories: [...new Set(allSources.map(s => s.category))].length
    };

    console.log('\n📊 Information Sources Statistics:');
    console.log(`- Total sources: ${stats.total}`);
    console.log(`- Active sources: ${stats.active}`);
    console.log(`- Free sources: ${stats.free}`);
    console.log(`- Free & Active: ${stats.freeAndActive}`);
    console.log(`- Average quality: ${stats.avgQuality.toFixed(1)}/5`);
    console.log(`- Categories: ${stats.categories}`);

    console.log('\n🎯 Immediate recommendations (Free & Active, 4+ stars):');
    allSources
      .filter(s => s.is_free && s.is_active && s.quality_rating >= 4)
      .forEach(s => {
        console.log(`- ${s.name} (${s.category}): ${s.quality_rating}⭐`);
      });
  }
}

main().catch(console.error);