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

console.log('🚀 Extending content_sources table for source classification...');

// Since we can't use ALTER TABLE directly, we'll add the data via updates
// First, let's get all existing sources
const { data: existingSources, error: fetchError } = await supabase
  .from('content_sources')
  .select('*');

if (fetchError) {
  console.error('❌ Error fetching existing sources:', fetchError);
  process.exit(1);
}

console.log('📋 Found', existingSources.length, 'existing sources to classify');

// Classification mapping based on existing sources
const sourceClassification = {
  'hacker news': { source_type: 'tertiary', credibility_score: 6, verification_level: 'community' },
  'github trending': { source_type: 'secondary', credibility_score: 7, verification_level: 'official' }, // GitHub is official for dev tools
  'indie hackers': { source_type: 'tertiary', credibility_score: 6, verification_level: 'community' },
  'y combinator news': { source_type: 'tertiary', credibility_score: 7, verification_level: 'community' },
  'techcrunch': { source_type: 'secondary', credibility_score: 7, verification_level: 'editorial' },
  'stack overflow blog': { source_type: 'secondary', credibility_score: 8, verification_level: 'editorial' },
  'ars technica': { source_type: 'secondary', credibility_score: 8, verification_level: 'editorial' },
  'product hunt': { source_type: 'tertiary', credibility_score: 5, verification_level: 'community' },
  'openai blog': { source_type: 'primary', credibility_score: 9, verification_level: 'official' },
  'anthropic news': { source_type: 'primary', credibility_score: 9, verification_level: 'official' },
  'meta ai blog': { source_type: 'primary', credibility_score: 8, verification_level: 'official' },
  'google ai blog': { source_type: 'primary', credibility_score: 8, verification_level: 'official' },
};

// Since we can't alter table structure via client, let's create a new table mapping
console.log('💡 Creating source_classifications table as extension...');

try {
  // Check if classifications table exists
  const { data: classData, error: classError } = await supabase
    .from('source_classifications')
    .select('count', { count: 'exact', head: true });
  
  if (classError && classError.code === 'PGRST205') {
    console.log('ℹ️  source_classifications table does not exist');
    console.log('');
    console.log('📝 Manual table creation required:');
    console.log('');
    console.log('-- Execute in Supabase Dashboard SQL Editor:');
    console.log('CREATE TABLE IF NOT EXISTS public.source_classifications (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  content_source_id UUID NOT NULL REFERENCES public.content_sources(id),');
    console.log('  source_type TEXT NOT NULL CHECK (source_type IN (\'primary\', \'secondary\', \'tertiary\')),');
    console.log('  credibility_score INTEGER NOT NULL CHECK (credibility_score >= 1 AND credibility_score <= 10),');
    console.log('  verification_level TEXT NOT NULL CHECK (verification_level IN (\'official\', \'editorial\', \'community\')),');
    console.log('  domain TEXT,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  UNIQUE(content_source_id)');
    console.log(');');
    console.log('');
    console.log('-- Enable RLS');
    console.log('ALTER TABLE public.source_classifications ENABLE ROW LEVEL SECURITY;');
    console.log('CREATE POLICY "Allow public read access to source_classifications" ON public.source_classifications FOR SELECT TO public USING (true);');
    
    // Prepare classification data
    const classificationsToInsert = [];
    
    for (const source of existingSources) {
      const sourceName = source.name.toLowerCase();
      const classification = sourceClassification[sourceName] || {
        source_type: 'tertiary', // default
        credibility_score: 5,
        verification_level: 'community'
      };
      
      // Extract domain from URL
      let domain = '';
      try {
        domain = new URL(source.url).hostname;
      } catch (e) {
        domain = source.url;
      }
      
      classificationsToInsert.push({
        content_source_id: source.id,
        source_type: classification.source_type,
        credibility_score: classification.credibility_score,
        verification_level: classification.verification_level,
        domain: domain
      });
    }
    
    // Save to JSON file for manual insertion
    fs.writeFileSync('source_classifications_data.json', JSON.stringify(classificationsToInsert, null, 2));
    console.log('💾 Classification data prepared in: source_classifications_data.json');
    console.log('');
    console.log('📊 Classifications summary:');
    const typeCount = classificationsToInsert.reduce((acc, item) => {
      acc[item.source_type] = (acc[item.source_type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   🏷️  ${type}: ${count} sources`);
    });
    
  } else {
    console.log('✅ source_classifications table exists');
  }
  
} catch (error) {
  console.error('❌ Error:', error);
}

console.log('');
console.log('🎯 Next steps:');
console.log('1. Execute the SQL in Supabase Dashboard');
console.log('2. Insert data from source_classifications_data.json');
console.log('3. Update API to use source classifications');
console.log('4. Update UI components for filtering');