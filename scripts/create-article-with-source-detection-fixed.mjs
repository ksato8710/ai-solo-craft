import { createClient } from '@supabase/supabase-js';
import { SourceDetectionHelper } from './source-detection-helper.mjs';
import * as fs from 'fs';
import crypto from 'crypto';

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

/**
 * Create article with automatic source detection (fixed version)
 */
export async function createArticleWithSourceDetection(articleData) {
  console.log('📝 Creating article with source detection...');
  
  // Initialize source detection
  const sourceHelper = new SourceDetectionHelper();
  await sourceHelper.initialize();
  
  // Extract source URL from articleData or references
  const sourceUrl = articleData.source_url || 
                   articleData.references?.[0]?.url ||
                   articleData.body_markdown?.match(/https?:\/\/[^\s)]+/)?.[0];
  
  // Detect source from article data
  const detection = sourceHelper.detectSource({
    url: sourceUrl,
    title: articleData.title,
    content: articleData.body_markdown || articleData.content,
    summary: articleData.description
  });
  
  // Generate required fields based on actual schema
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const slug = articleData.slug || articleData.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
    
  // Create checksum for content
  const checksum = crypto
    .createHash('md5')
    .update(articleData.body_markdown || '')
    .digest('hex');
  
  // Prepare article data matching the actual schema
  const enrichedArticleData = {
    slug,
    title: articleData.title,
    description: articleData.description || '',
    content_type: articleData.content_type || 'news',
    status: articleData.status || 'published',
    published_at: articleData.published_at || now.toISOString(),
    date: dateStr,
    read_time: Math.ceil((articleData.body_markdown || '').length / 1000), // rough estimate
    hero_image_url: articleData.hero_image_url || null,
    body_markdown: articleData.body_markdown || '',
    body_html: null,
    legacy_category: articleData.legacy_category || 'ai-news',
    authoring_source: articleData.authoring_source || 'markdown',
    source_path: articleData.source_path || `auto-${Date.now()}`,
    checksum,
    featured: articleData.featured || false,
    // Source information (the new fields)
    primary_source_id: detection?.source?.id || null,
    source_credibility_score: detection?.source?.credibility_score || null,
    source_verification_note: detection ? 
      `Auto-detected: ${detection.source.name} (${detection.source.source_type}, confidence: ${detection.confidence})` : 
      null
  };
  
  // Log detection result
  if (detection) {
    console.log(`🎯 Source detected: ${detection.source.name} (${detection.source.source_type})`);
    console.log(`   Confidence: ${detection.confidence}, Method: ${detection.method}`);
    console.log(`   Credibility: ${detection.source.credibility_score}/10`);
  } else {
    console.log('⚠️  No source detected for this article');
  }
  
  // Insert into database
  const { data, error } = await supabase
    .from('contents')
    .insert(enrichedArticleData)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create article:', error);
    throw error;
  }
  
  console.log(`✅ Article created: "${data.title}"`);
  console.log(`   ID: ${data.id}`);
  console.log(`   Slug: ${data.slug}`);
  
  // Return enriched data
  return {
    article: data,
    source_detection: detection ? {
      source: sourceHelper.getSourceClassification(detection.source.id),
      confidence: detection.confidence,
      method: detection.method
    } : null
  };
}

/**
 * Demo function for testing
 */
async function runDemo() {
  console.log('🧪 Running source detection demo...');
  
  const testCases = [
    {
      title: 'OpenAI announces GPT-5 with revolutionary capabilities',
      description: 'OpenAI has released GPT-5, featuring enhanced reasoning and coding abilities.',
      body_markdown: `# GPT-5 Released

OpenAI has officially announced the release of GPT-5, marking a significant milestone in AI development.

## Key Features
- Enhanced reasoning capabilities
- Improved coding assistance
- Better multimodal understanding

Read more at: https://openai.com/blog/gpt-5-announcement`,
      source_url: 'https://openai.com/blog/gpt-5-announcement',
      slug: 'openai-gpt5-demo-test'
    },
    {
      title: 'GitHub unveils new AI-powered developer tools',
      description: 'GitHub announces new features for developers using artificial intelligence.',
      body_markdown: `# GitHub AI Tools

GitHub has introduced several new AI-powered features to enhance the developer experience.

Features include advanced code completion and automated testing.`,
      source_url: 'https://github.blog/ai-developer-tools',
      slug: 'github-ai-tools-demo-test'  
    },
    {
      title: 'Hacker News discusses the future of AI development',
      description: 'Community discussion on emerging AI trends and their implications.',
      body_markdown: `# AI Development Discussion

The Hacker News community has been actively discussing recent trends in AI development.

Topics include model scaling, efficiency improvements, and practical applications.`,
      source_url: 'https://news.ycombinator.com/item?id=12345',
      slug: 'hn-ai-discussion-demo-test'
    }
  ];
  
  console.log(`📰 Testing ${testCases.length} demo articles...`);
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await createArticleWithSourceDetection(testCase);
      results.push({ ...result, success: true });
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to process: ${testCase.title}`);
      console.error(error.message);
      results.push({ error: error.message, success: false });
      console.log('');
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const withSources = results.filter(r => r.success && r.source_detection).length;
  
  console.log(`📊 Demo Summary:`);
  console.log(`   Total: ${testCases.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   With source detection: ${withSources}`);
  console.log(`   Detection rate: ${successful > 0 ? Math.round((withSources / successful) * 100) : 0}%`);
  
  if (withSources > 0) {
    console.log(`\\n📋 Detected sources:`);
    results.filter(r => r.success && r.source_detection).forEach(r => {
      const source = r.source_detection.source;
      console.log(`   • ${source.name} (${source.type}, ${r.source_detection.confidence} confidence)`);
    });
  }
  
  return results;
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === 'demo') {
    runDemo().catch(console.error);
  } else {
    console.log('Usage: node create-article-with-source-detection-fixed.mjs demo');
  }
}