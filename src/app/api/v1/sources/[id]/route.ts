import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const revalidate = 600; // Cache for 10 minutes
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function generateSourceBadge(source_type: string): string {
  switch (source_type) {
    case 'primary': return '🥇 Official';
    case 'secondary': return '🥈 Editorial';
    case 'tertiary': return '🥉 Community';
    case 'official': return '🥇 Official';
    case 'media': return '🥈 Editorial';
    case 'community': return '🥉 Community';
    case 'social': return '🥉 Community';
    default: return '📰 Other';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceId } = await params;

    if (!sourceId) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    // Get source details
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      if (sourceError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }
      console.error('[api/v1/sources/[id]] Source query error:', sourceError);
      return NextResponse.json({ error: 'Failed to load source' }, { status: 500 });
    }

    // Get article count for this source
    const { count: articleCount } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('primary_source_id', sourceId)
      .eq('status', 'published');

    // Calculate average NVA score for articles from this source
    const { data: nvaData } = await supabase
      .from('digest_ranking_items')
      .select('nva_total')
      .not('nva_total', 'is', null)
      .not('news_content_id', 'is', null);

    // For now, we'll calculate a mock average since we need to join with contents table
    // This would need a more complex query in a real implementation
    const avgNvaScore = nvaData && nvaData.length > 0 
      ? nvaData.reduce((sum, item) => sum + (item.nva_total || 0), 0) / nvaData.length
      : null;

    const sourceAny = source as any; // Temporary until type definitions are updated
    const apiSource = {
      id: sourceAny.id,
      name: sourceAny.name,
      domain: sourceAny.domain,
      url: sourceAny.url,
      source_type: sourceAny.source_type,
      credibility_score: sourceAny.credibility_score,
      verification_level: sourceAny.verification_level,
      description: sourceAny.description,
      tags: sourceAny.tags,
      logo_url: sourceAny.logo_url,
      website_url: sourceAny.website_url,
      badge: generateSourceBadge(sourceAny.source_type),
      article_count: articleCount || 0,
      avg_nva_score: avgNvaScore ? Math.round(avgNvaScore * 10) / 10 : null,
      created_at: sourceAny.created_at,
      updated_at: sourceAny.updated_at,
    };

    return NextResponse.json(
      { source: apiSource },
      {
        headers: {
          'Cache-Control': 's-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/sources/[id]] Failed:', error);
    return NextResponse.json({ error: 'Failed to load source' }, { status: 500 });
  }
}