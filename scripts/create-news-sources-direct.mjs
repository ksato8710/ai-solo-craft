import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = {};
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key] = value;
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 Creating news_sources table directly...');

try {
  // Step 1: Check if table exists
  console.log('📋 Checking if news_sources table exists...');
  const { data: existingData, error: checkError } = await supabase
    .from('news_sources')
    .select('count', { count: 'exact', head: true });
  
  if (!checkError) {
    console.log('ℹ️  Table already exists with', existingData || 0, 'records');
    process.exit(0);
  }

  // Step 2: Create table using client operations (since exec_sql is not available)
  console.log('🔨 Creating table structure...');
  
  // Since we can't use raw SQL, we'll need to insert data directly
  // Let's check if we can create the table via migrations instead
  
  const initialSources = [
    // PRIMARY SOURCES (Official sources)
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog',
      domain: 'openai.com',
      source_type: 'primary',
      credibility_score: 9,
      verification_level: 'official',
      description: 'OpenAI公式ブログ - GPT, ChatGPT, DALL-Eなどの最新発表',
      category: 'ai-official'
    },
    {
      name: 'Anthropic News',
      url: 'https://www.anthropic.com/news',
      domain: 'anthropic.com',
      source_type: 'primary',
      credibility_score: 9,
      verification_level: 'official',
      description: 'Anthropic公式ニュース - Claude関連の公式発表',
      category: 'ai-official'
    },
    {
      name: 'Meta AI Blog',
      url: 'https://ai.meta.com/blog',
      domain: 'ai.meta.com',
      source_type: 'primary',
      credibility_score: 8,
      verification_level: 'official',
      description: 'Meta AI公式ブログ - LLaMA等の研究発表',
      category: 'ai-official'
    },
    {
      name: 'Google AI Blog',
      url: 'https://ai.googleblog.com',
      domain: 'ai.googleblog.com',
      source_type: 'primary',
      credibility_score: 8,
      verification_level: 'official',
      description: 'Google AI公式ブログ - Gemini等の技術発表',
      category: 'ai-official'
    },
    // SECONDARY SOURCES (Editorial)
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      domain: 'techcrunch.com',
      source_type: 'secondary',
      credibility_score: 7,
      verification_level: 'editorial',
      description: '技術系メディアの老舗、編集部による分析記事',
      category: 'tech-media'
    },
    {
      name: 'The Verge',
      url: 'https://www.theverge.com',
      domain: 'theverge.com',
      source_type: 'secondary',
      credibility_score: 7,
      verification_level: 'editorial',
      description: 'テクノロジー専門メディア',
      category: 'tech-media'
    },
    {
      name: 'Ars Technica',
      url: 'https://arstechnica.com',
      domain: 'arstechnica.com',
      source_type: 'secondary',
      credibility_score: 8,
      verification_level: 'editorial',
      description: '技術に特化した高品質な分析メディア',
      category: 'tech-media'
    },
    // TERTIARY SOURCES (Community)
    {
      name: 'Hacker News',
      url: 'https://news.ycombinator.com',
      domain: 'news.ycombinator.com',
      source_type: 'tertiary',
      credibility_score: 6,
      verification_level: 'community',
      description: 'プログラマー・起業家コミュニティによるニュースランキング',
      category: 'tech-community'
    },
    {
      name: 'Reddit r/MachineLearning',
      url: 'https://reddit.com/r/MachineLearning',
      domain: 'reddit.com',
      source_type: 'tertiary',
      credibility_score: 5,
      verification_level: 'community',
      description: 'Reddit機械学習コミュニティ',
      category: 'ai-community'
    },
    {
      name: 'X (Twitter)',
      url: 'https://twitter.com',
      domain: 'twitter.com',
      source_type: 'tertiary',
      credibility_score: 4,
      verification_level: 'community',
      description: 'X/Twitter投稿（個人発信含む）',
      category: 'social-media'
    }
  ];

  console.log('❌ Cannot create table directly via client.');
  console.log('💡 Manual setup required via Supabase Dashboard SQL editor:');
  console.log('');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Execute the SQL from: sql/create_news_sources_table.sql');
  console.log('3. Or copy this manual command:');
  console.log('');
  console.log('-- Create news_sources table');
  console.log('CREATE TABLE IF NOT EXISTS public.news_sources (');
  console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
  console.log('  name TEXT NOT NULL,');
  console.log('  url TEXT NOT NULL,');
  console.log('  domain TEXT NOT NULL,');
  console.log('  source_type TEXT NOT NULL CHECK (source_type IN (\'primary\', \'secondary\', \'tertiary\')),');
  console.log('  credibility_score INTEGER NOT NULL CHECK (credibility_score >= 1 AND credibility_score <= 10),');
  console.log('  verification_level TEXT NOT NULL CHECK (verification_level IN (\'official\', \'editorial\', \'community\')),');
  console.log('  description TEXT,');
  console.log('  category TEXT,');
  console.log('  is_active BOOLEAN DEFAULT true,');
  console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log(');');
  
  console.log('');
  console.log('📊 Sample data to insert:', initialSources.length, 'sources ready');
  
  // Save initial data to JSON for manual insertion
  fs.writeFileSync('initial_news_sources.json', JSON.stringify(initialSources, null, 2));
  console.log('💾 Initial data saved to: initial_news_sources.json');
  
} catch (error) {
  console.error('❌ Error:', error);
}