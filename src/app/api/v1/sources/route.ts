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

interface ApiSource {
  id: string;
  name: string;
  domain: string | null;
  url: string;
  source_type: 'primary' | 'secondary' | 'tertiary' | 'official' | 'media' | 'community' | 'social' | 'other';
  credibility_score: number | null;
  verification_level: 'official' | 'editorial' | 'community' | null;
  description: string | null;
  badge: string;
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceType = searchParams.get('source_type');
    const minCredibility = searchParams.get('min_credibility');
    const maxCredibility = searchParams.get('max_credibility');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('sources')
      .select('*')
      .order('credibility_score', { ascending: false })
      .order('name');

    // Apply filters
    if (sourceType) {
      query = query.eq('source_type', sourceType as any);
    }

    if (minCredibility) {
      const min = parseInt(minCredibility);
      if (!isNaN(min)) {
        query = query.gte('credibility_score', min);
      }
    }

    if (maxCredibility) {
      const max = parseInt(maxCredibility);
      if (!isNaN(max)) {
        query = query.lte('credibility_score', max);
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: sources, error, count } = await query;

    if (error) {
      console.error('[api/v1/sources] Database error:', error);
      return NextResponse.json({ error: 'Failed to load sources' }, { status: 500 });
    }

    const apiSources: ApiSource[] = (sources || []).map(source => {
      const sourceAny = source as any; // Temporary until type definitions are updated
      return {
        id: sourceAny.id,
        name: sourceAny.name,
        domain: sourceAny.domain,
        url: sourceAny.url,
        source_type: sourceAny.source_type,
        credibility_score: sourceAny.credibility_score,
        verification_level: sourceAny.verification_level,
        description: sourceAny.description,
        badge: generateSourceBadge(sourceAny.source_type),
      };
    });

    return NextResponse.json(
      {
        total: count || apiSources.length,
        limit,
        offset,
        sources: apiSources,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/sources] Failed:', error);
    return NextResponse.json({ error: 'Failed to load sources' }, { status: 500 });
  }
}