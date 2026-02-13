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

console.log('🔗 Linking articles to sources...');

// Step 1: Get all articles without source information
const { data: articles, error: articlesError } = await supabase
  .from('contents')
  .select('id, slug, title, description, body_markdown, authoring_source')
  .is('primary_source_id', null)
  .eq('status', 'published');

if (articlesError) {
  console.error('❌ Error fetching articles:', articlesError);
  process.exit(1);
}

console.log(`📰 Found ${articles.length} articles without source information`);

// Step 2: Get all available content sources
const { data: sources, error: sourcesError } = await supabase
  .from('content_sources')
  .select('*');

if (sourcesError) {
  console.error('❌ Error fetching sources:', sourcesError);
  process.exit(1);
}

console.log(`📚 Found ${sources.length} available content sources`);

// Step 3: Create source classification mapping
const sourceClassifications = {
  // Primary sources (Official company blogs)
  'openai.com': { type: 'primary', score: 9, level: 'official' },
  'anthropic.com': { type: 'primary', score: 9, level: 'official' },
  'ai.meta.com': { type: 'primary', score: 8, level: 'official' },
  'ai.googleblog.com': { type: 'primary', score: 8, level: 'official' },
  'github.com': { type: 'primary', score: 8, level: 'official' },
  'aws.amazon.com': { type: 'primary', score: 8, level: 'official' },
  
  // Secondary sources (Editorial media)
  'techcrunch.com': { type: 'secondary', score: 7, level: 'editorial' },
  'theverge.com': { type: 'secondary', score: 7, level: 'editorial' },
  'arstechnica.com': { type: 'secondary', score: 8, level: 'editorial' },
  'wired.com': { type: 'secondary', score: 7, level: 'editorial' },
  'infoq.com': { type: 'secondary', score: 8, level: 'editorial' },
  'sdtimes.com': { type: 'secondary', score: 7, level: 'editorial' },
  
  // Tertiary sources (Community)
  'news.ycombinator.com': { type: 'tertiary', score: 6, level: 'community' },
  'reddit.com': { type: 'tertiary', score: 5, level: 'community' },
  'twitter.com': { type: 'tertiary', score: 4, level: 'community' },
  'medium.com': { type: 'tertiary', score: 5, level: 'community' },
  'dev.to': { type: 'tertiary', score: 6, level: 'community' },
  'indiehackers.com': { type: 'tertiary', score: 6, level: 'community' },
};

// Function to detect source from article content
function detectSourceFromArticle(article) {
  const content = (article.body_markdown || '').toLowerCase();
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  
  // Look for URLs in content
  const urlRegex = /https?:\/\/([^\/\s]+)/g;
  const urls = [...content.matchAll(urlRegex)];
  
  // Score potential sources
  const sourceScores = {};
  
  for (const source of sources) {
    const sourceName = source.name.toLowerCase();
    const sourceUrl = source.url.toLowerCase();
    let score = 0;
    
    // Check for direct mentions
    if (title.includes(sourceName) || description.includes(sourceName)) {
      score += 10;
    }
    if (content.includes(sourceName)) {
      score += 5;
    }
    
    // Check for URL matches
    try {
      const sourceDomain = new URL(source.url).hostname.toLowerCase();
      for (const [, domain] of urls) {
        if (domain.includes(sourceDomain) || sourceDomain.includes(domain)) {
          score += 8;
        }
      }
    } catch (e) {
      // Ignore malformed URLs
    }
    
    // Special keyword matching
    if (sourceName.includes('openai') && (content.includes('gpt') || content.includes('chatgpt') || content.includes('dall-e'))) {
      score += 6;
    }
    if (sourceName.includes('anthropic') && content.includes('claude')) {
      score += 6;
    }
    if (sourceName.includes('github') && (content.includes('repository') || content.includes('commit') || content.includes('release'))) {
      score += 4;
    }
    if (sourceName.includes('hacker news') && content.includes('ycombinator')) {
      score += 6;
    }
    
    if (score > 0) {
      sourceScores[source.id] = { source, score };
    }
  }
  
  // Return highest scoring source
  const bestMatch = Object.values(sourceScores).sort((a, b) => b.score - a.score)[0];
  return bestMatch;
}

// Function to get credibility score based on source classification
function getCredibilityScore(source) {
  if (!source) return 5; // Default
  
  try {
    const domain = new URL(source.url).hostname.toLowerCase();
    const classification = sourceClassifications[domain];
    return classification ? classification.score : source.quality_rating || 5;
  } catch (e) {
    return source.quality_rating || 5;
  }
}

// Step 4: Process articles
console.log('🔍 Analyzing articles for source detection...');
const updates = [];
let processed = 0;
let matched = 0;

for (const article of articles) {
  processed++;
  
  const sourceMatch = detectSourceFromArticle(article);
  
  if (sourceMatch && sourceMatch.score >= 4) { // Minimum confidence threshold
    const credibilityScore = getCredibilityScore(sourceMatch.source);
    
    updates.push({
      id: article.id,
      primary_source_id: sourceMatch.source.id,
      source_credibility_score: credibilityScore,
      source_verification_note: `Auto-detected (confidence: ${sourceMatch.score})`
    });
    
    matched++;
    console.log(`✅ ${article.title} → ${sourceMatch.source.name} (score: ${sourceMatch.score})`);
  } else {
    console.log(`⚠️  ${article.title} → No reliable source detected`);
  }
  
  if (processed % 10 === 0) {
    console.log(`📊 Progress: ${processed}/${articles.length} processed, ${matched} matched`);
  }
}

console.log(`\n🎯 Summary: ${matched}/${articles.length} articles matched to sources`);

// Step 5: Apply updates
if (updates.length > 0 && process.argv.includes('--apply')) {
  console.log('💾 Applying updates to database...');
  
  for (const update of updates) {
    const { error } = await supabase
      .from('contents')
      .update({
        primary_source_id: update.primary_source_id,
        source_credibility_score: update.source_credibility_score,
        source_verification_note: update.source_verification_note
      })
      .eq('id', update.id);
    
    if (error) {
      console.error(`❌ Failed to update ${update.id}:`, error);
    }
  }
  
  console.log('✅ Database updates completed!');
  
  // Verify updates
  const { data: updated, error: verifyError } = await supabase
    .from('contents')
    .select('id')
    .not('primary_source_id', 'is', null)
    .eq('status', 'published');
  
  if (!verifyError) {
    console.log(`🎉 Verification: ${updated.length} articles now have source information`);
  }
} else {
  console.log('\n💡 Dry run completed. Add --apply flag to execute updates');
  console.log('📄 Preview updates:');
  updates.slice(0, 5).forEach(update => {
    const article = articles.find(a => a.id === update.id);
    const source = sources.find(s => s.id === update.primary_source_id);
    console.log(`   • ${article.title} → ${source.name} (${update.source_credibility_score}/10)`);
  });
}

// Save detailed results
const results = {
  processed: articles.length,
  matched: updates.length,
  sources_available: sources.length,
  updates: updates.map(u => ({
    article_id: u.id,
    article_title: articles.find(a => a.id === u.id)?.title,
    source_name: sources.find(s => s.id === u.primary_source_id)?.name,
    credibility_score: u.source_credibility_score,
    verification_note: u.source_verification_note
  }))
};

fs.writeFileSync('source_linking_results.json', JSON.stringify(results, null, 2));
console.log('📊 Detailed results saved to: source_linking_results.json');