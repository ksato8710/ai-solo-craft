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

console.log('🔗 Linking articles to sources (using correct sources table)...');

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

// Step 2: Get all available sources (correct table)
const { data: sources, error: sourcesError } = await supabase
  .from('sources')
  .select('*');

if (sourcesError) {
  console.error('❌ Error fetching sources:', sourcesError);
  process.exit(1);
}

console.log(`📚 Found ${sources.length} available sources`);
console.log('📊 Sources by type:');
const sourcesByType = sources.reduce((acc, source) => {
  acc[source.source_type] = (acc[source.source_type] || 0) + 1;
  return acc;
}, {});
Object.entries(sourcesByType).forEach(([type, count]) => {
  console.log(`   ${type}: ${count} sources`);
});

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
    const sourceDomain = source.domain.toLowerCase();
    let score = 0;
    
    // Check for direct mentions
    if (title.includes(sourceName) || description.includes(sourceName)) {
      score += 10;
    }
    if (content.includes(sourceName)) {
      score += 5;
    }
    
    // Check for domain matches
    if (sourceDomain) {
      for (const [, domain] of urls) {
        if (domain.includes(sourceDomain) || sourceDomain.includes(domain)) {
          score += 8;
        }
      }
      
      // Check content for domain mentions
      if (content.includes(sourceDomain)) {
        score += 6;
      }
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
    if (sourceName.includes('hacker news') && (content.includes('ycombinator') || content.includes('hackernews'))) {
      score += 6;
    }
    if (sourceName.includes('techcrunch') && content.includes('techcrunch')) {
      score += 8;
    }
    if (sourceName.includes('indie hackers') && content.includes('indie')) {
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

// Step 4: Process articles
console.log('🔍 Analyzing articles for source detection...');
const updates = [];
let processed = 0;
let matched = 0;

for (const article of articles) {
  processed++;
  
  const sourceMatch = detectSourceFromArticle(article);
  
  if (sourceMatch && sourceMatch.score >= 4) { // Minimum confidence threshold
    const credibilityScore = sourceMatch.source.credibility_score || 5;
    
    updates.push({
      id: article.id,
      primary_source_id: sourceMatch.source.id,
      source_credibility_score: credibilityScore,
      source_verification_note: `Auto-detected from ${sourceMatch.source.source_type} source (confidence: ${sourceMatch.score})`
    });
    
    matched++;
    console.log(`✅ "${article.title}" → ${sourceMatch.source.name} (${sourceMatch.source.source_type}, score: ${sourceMatch.score})`);
  } else {
    console.log(`⚠️  "${article.title}" → No reliable source detected`);
  }
  
  if (processed % 10 === 0) {
    console.log(`📊 Progress: ${processed}/${articles.length} processed, ${matched} matched`);
  }
}

console.log(`\\n🎯 Summary: ${matched}/${articles.length} articles matched to sources`);

// Step 5: Apply updates
if (updates.length > 0 && process.argv.includes('--apply')) {
  console.log('💾 Applying updates to database...');
  
  let updated = 0;
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
    } else {
      updated++;
    }
  }
  
  console.log(`✅ Database updates completed! ${updated}/${updates.length} successful`);
  
  // Verify updates
  const { data: verifiedUpdates, error: verifyError } = await supabase
    .from('contents')
    .select(`
      id, title, source_credibility_score,
      sources!inner (
        name, source_type, credibility_score
      )
    `)
    .not('primary_source_id', 'is', null)
    .eq('status', 'published')
    .limit(10);
  
  if (!verifyError) {
    console.log(`🎉 Verification: ${verifiedUpdates.length} sample articles with source info:`);
    verifiedUpdates.forEach(article => {
      console.log(`   • ${article.sources.name} (${article.sources.source_type}) - Score: ${article.source_credibility_score}`);
    });
  }
} else {
  console.log('\\n💡 Dry run completed. Add --apply flag to execute updates');
  console.log('📄 Preview top matches:');
  updates.slice(0, 8).forEach(update => {
    const article = articles.find(a => a.id === update.id);
    const source = sources.find(s => s.id === update.primary_source_id);
    console.log(`   • "${article.title}" → ${source.name} (${source.source_type}, ${update.source_credibility_score}/10)`);
  });
}

// Save detailed results
const results = {
  timestamp: new Date().toISOString(),
  processed: articles.length,
  matched: updates.length,
  sources_available: sources.length,
  sources_by_type: sourcesByType,
  updates: updates.map(u => ({
    article_id: u.id,
    article_title: articles.find(a => a.id === u.id)?.title,
    source_id: u.primary_source_id,
    source_name: sources.find(s => s.id === u.primary_source_id)?.name,
    source_type: sources.find(s => s.id === u.primary_source_id)?.source_type,
    credibility_score: u.source_credibility_score,
    verification_note: u.source_verification_note
  }))
};

fs.writeFileSync('source_linking_results_fixed.json', JSON.stringify(results, null, 2));
console.log('📊 Detailed results saved to: source_linking_results_fixed.json');