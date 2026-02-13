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

// Source detection helper class
export class SourceDetectionHelper {
  constructor() {
    this.sources = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('🔍 Loading source database...');
    const { data, error } = await supabase.from('sources').select('*');
    
    if (error) {
      throw new Error(`Failed to load sources: ${error.message}`);
    }
    
    this.sources = data;
    this.initialized = true;
    
    console.log(`✅ Loaded ${this.sources.length} sources`);
    const typeCount = this.sources.reduce((acc, source) => {
      acc[source.source_type] = (acc[source.source_type] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Source types:', typeCount);
  }

  // Detect source from URL
  detectSourceFromUrl(url) {
    if (!this.sources) {
      throw new Error('SourceDetectionHelper not initialized');
    }

    if (!url) return null;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Direct domain match
      for (const source of this.sources) {
        const sourceDomain = source.domain?.toLowerCase();
        if (sourceDomain && (domain === sourceDomain || domain.includes(sourceDomain))) {
          return {
            source,
            confidence: 10,
            method: 'domain_match'
          };
        }
      }
      
      // Partial domain match
      for (const source of this.sources) {
        const sourceDomain = source.domain?.toLowerCase();
        if (sourceDomain && domain.includes(sourceDomain.split('.')[0])) {
          return {
            source,
            confidence: 7,
            method: 'partial_domain_match'
          };
        }
      }
      
    } catch (e) {
      console.warn(`Invalid URL: ${url}`);
    }
    
    return null;
  }

  // Detect source from content
  detectSourceFromContent(content) {
    if (!this.sources) {
      throw new Error('SourceDetectionHelper not initialized');
    }

    const contentLower = content.toLowerCase();
    const sourceScores = [];

    for (const source of this.sources) {
      const sourceName = source.name.toLowerCase();
      const sourceDomain = source.domain?.toLowerCase();
      let score = 0;
      let methods = [];

      // Direct name mention
      if (contentLower.includes(sourceName)) {
        score += 5;
        methods.push('name_mention');
      }

      // Domain mention
      if (sourceDomain && contentLower.includes(sourceDomain)) {
        score += 6;
        methods.push('domain_mention');
      }

      // URL reference
      const urlPattern = new RegExp(`https?://[^\\s]*${sourceDomain?.replace('.', '\\.')}`, 'gi');
      if (sourceDomain && contentLower.match(urlPattern)) {
        score += 8;
        methods.push('url_reference');
      }

      // Special keyword matching
      if (sourceName.includes('openai') && (contentLower.includes('gpt') || contentLower.includes('chatgpt') || contentLower.includes('dall-e'))) {
        score += 4;
        methods.push('keyword_openai');
      }
      if (sourceName.includes('anthropic') && contentLower.includes('claude')) {
        score += 4;
        methods.push('keyword_anthropic');
      }
      if (sourceName.includes('github') && (contentLower.includes('repository') || contentLower.includes('commit') || contentLower.includes('release'))) {
        score += 3;
        methods.push('keyword_github');
      }

      if (score > 0) {
        sourceScores.push({
          source,
          confidence: score,
          methods,
          method: methods.join(', ')
        });
      }
    }

    // Return highest scoring source
    return sourceScores.sort((a, b) => b.confidence - a.confidence)[0] || null;
  }

  // Comprehensive source detection
  detectSource(data) {
    if (!this.initialized) {
      throw new Error('SourceDetectionHelper not initialized');
    }

    const { url, title = '', content = '', summary = '' } = data;
    
    // Try URL-based detection first (most reliable)
    const urlResult = this.detectSourceFromUrl(url);
    if (urlResult && urlResult.confidence >= 7) {
      return urlResult;
    }

    // Try content-based detection
    const combinedContent = [title, content, summary].join(' ');
    const contentResult = this.detectSourceFromContent(combinedContent);
    if (contentResult && contentResult.confidence >= 4) {
      return contentResult;
    }

    // Return URL result even with lower confidence, or null
    return urlResult;
  }

  // Get source classification details
  getSourceClassification(sourceId) {
    if (!this.sources) return null;
    
    const source = this.sources.find(s => s.id === sourceId);
    if (!source) return null;
    
    return {
      id: source.id,
      name: source.name,
      type: source.source_type,
      credibility_score: source.credibility_score,
      verification_level: source.verification_level,
      domain: source.domain
    };
  }

  // Add detected source info to news candidate
  async enrichNewsCandidate(candidate) {
    const detection = this.detectSource({
      url: candidate.source_url,
      title: candidate.title,
      content: candidate.summary || ''
    });

    if (detection) {
      return {
        ...candidate,
        detected_source_id: detection.source.id,
        source_confidence: detection.confidence,
        source_detection_method: detection.method,
        source_type: detection.source.source_type,
        source_credibility_score: detection.source.credibility_score
      };
    }

    return candidate;
  }

  // Batch enrich multiple candidates
  async enrichNewsCandidates(candidates) {
    const enriched = [];
    
    for (const candidate of candidates) {
      const enrichedCandidate = await this.enrichNewsCandidate(candidate);
      enriched.push(enrichedCandidate);
      
      if (enrichedCandidate.detected_source_id) {
        const source = this.sources.find(s => s.id === enrichedCandidate.detected_source_id);
        console.log(`🔍 "${candidate.title}" → ${source.name} (${source.source_type}, confidence: ${enrichedCandidate.source_confidence})`);
      } else {
        console.log(`⚠️  "${candidate.title}" → No source detected`);
      }
    }
    
    return enriched;
  }

  // Get statistics
  getStatistics(enrichedCandidates) {
    const total = enrichedCandidates.length;
    const detected = enrichedCandidates.filter(c => c.detected_source_id).length;
    
    const byType = enrichedCandidates
      .filter(c => c.source_type)
      .reduce((acc, c) => {
        acc[c.source_type] = (acc[c.source_type] || 0) + 1;
        return acc;
      }, {});

    return {
      total,
      detected,
      detection_rate: Math.round((detected / total) * 100),
      by_type: byType
    };
  }
}

// Standalone functions for direct usage
export async function initializeSourceDetection() {
  const helper = new SourceDetectionHelper();
  await helper.initialize();
  return helper;
}

export async function detectAndEnrichCandidates(candidates) {
  const helper = await initializeSourceDetection();
  return await helper.enrichNewsCandidates(candidates);
}