import { createClient } from '@supabase/supabase-js';
import { SourceDetectionHelper } from './source-detection-helper.mjs';
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

/**
 * Create article with automatic source detection
 */
export async function createArticleWithSourceDetection(articleData) {
  console.log('📝 Creating article with source detection...');
  
  // Initialize source detection
  const sourceHelper = new SourceDetectionHelper();
  await sourceHelper.initialize();
  
  // Detect source from article data
  const detection = sourceHelper.detectSource({
    url: articleData.source_url || articleData.references?.[0]?.url,
    title: articleData.title,
    content: articleData.body_markdown || articleData.content,
    summary: articleData.description
  });
  
  // Prepare article data with source information
  const enrichedArticleData = {
    ...articleData,
    primary_source_id: detection?.source?.id || null,
    source_credibility_score: detection?.source?.credibility_score || null,
    source_verification_note: detection ? 
      `Auto-detected from ${detection.source.source_type} source (confidence: ${detection.confidence}, method: ${detection.method})` : 
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
  
  console.log(`✅ Article created with ID: ${data.id}`);
  
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
 * Batch process news candidates and create articles
 */
export async function processNewsCandidatesWithSources(candidates) {
  console.log(`📰 Processing ${candidates.length} news candidates...`);
  
  const sourceHelper = new SourceDetectionHelper();
  await sourceHelper.initialize();
  
  const results = [];
  
  for (const candidate of candidates) {
    try {
      // Convert candidate to article format
      const articleData = {
        title: candidate.title,
        description: candidate.summary,
        content_type: 'news',
        status: 'published',
        published_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        authoring_source: 'auto_research',
        source_path: `news-research-${Date.now()}`,
        body_markdown: candidate.content || candidate.summary,
        slug: candidate.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50)
      };
      
      // Create article with source detection
      const result = await createArticleWithSourceDetection({
        ...articleData,
        source_url: candidate.source_url
      });
      
      results.push({
        candidate,
        ...result,
        success: true
      });
      
    } catch (error) {
      console.error(`❌ Failed to process candidate: ${candidate.title}`, error);
      results.push({
        candidate,
        error: error.message,
        success: false
      });
    }
  }
  
  // Statistics
  const successful = results.filter(r => r.success).length;
  const withSources = results.filter(r => r.success && r.source_detection).length;
  
  console.log(`\\n📊 Processing Summary:`);
  console.log(`   Total: ${candidates.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   With source detection: ${withSources}`);
  console.log(`   Source detection rate: ${Math.round((withSources / successful) * 100)}%`);
  
  // Source type breakdown
  if (withSources > 0) {
    const sourceTypes = results
      .filter(r => r.success && r.source_detection)
      .reduce((acc, r) => {
        const type = r.source_detection.source.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
    console.log(`\\n📋 Sources by type:`);
    Object.entries(sourceTypes).forEach(([type, count]) => {
      const emoji = type === 'primary' ? '🥇' : type === 'secondary' ? '🥈' : '🥉';
      console.log(`   ${emoji} ${type}: ${count}`);
    });
  }
  
  return results;
}

// Command line interface
if (process.argv[2] === 'test') {
  console.log('🧪 Testing article creation with source detection...');
  
  const testArticle = {
    title: 'OpenAI releases GPT-5 with enhanced capabilities',
    description: 'OpenAI announced the release of GPT-5, featuring improved reasoning and coding abilities.',
    content_type: 'news',
    status: 'published',
    body_markdown: '# GPT-5 Released\\n\\nOpenAI has officially released GPT-5...',
    source_url: 'https://openai.com/blog/gpt-5-release',
    slug: 'openai-gpt5-release-test'
  };
  
  createArticleWithSourceDetection(testArticle)
    .then(result => {
      console.log('✅ Test completed successfully');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
    });
}