import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

type SourceType =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'official'
  | 'media'
  | 'community'
  | 'social'
  | 'other';

type EntityKind =
  | 'primary_source'
  | 'global_media'
  | 'japanese_media'
  | 'newsletter'
  | 'community'
  | 'social'
  | 'tool_directory';

interface SourceEntity {
  id: string;
  name: string;
  url: string;
  domain: string | null;
  source_type: SourceType;
  credibility_score: number | null;
  verification_level: 'official' | 'editorial' | 'community' | null;
  entity_kind: EntityKind | null;
  locale: 'ja' | 'en' | 'multilingual' | 'other';
  region: 'jp' | 'global' | 'us' | 'eu' | 'other';
  is_active: boolean;
  is_newsletter: boolean;
  is_japanese_media: boolean;
  newsletter_from_email: string | null;
  newsletter_archive_url: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const FALLBACK_SOURCES: SourceEntity[] = [
  {
    id: 'fallback-1',
    name: 'The Rundown AI',
    url: 'https://www.therundown.ai/',
    domain: 'www.therundown.ai',
    source_type: 'secondary',
    credibility_score: 7,
    verification_level: 'editorial',
    entity_kind: 'newsletter',
    locale: 'en',
    region: 'global',
    is_active: true,
    is_newsletter: true,
    is_japanese_media: false,
    newsletter_from_email: 'news@daily.therundown.ai',
    newsletter_archive_url: 'https://www.therundown.ai/',
    description: 'Global AI newsletter for rapid signal detection.',
    notes: 'Use as detector, not final truth source.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/news',
    domain: 'www.anthropic.com',
    source_type: 'primary',
    credibility_score: 10,
    verification_level: 'official',
    entity_kind: 'primary_source',
    locale: 'en',
    region: 'global',
    is_active: true,
    is_newsletter: false,
    is_japanese_media: false,
    newsletter_from_email: null,
    newsletter_archive_url: null,
    description: 'Official primary source for Anthropic announcements.',
    notes: 'Always cite for Claude model updates.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    name: '日経クロステック',
    url: 'https://xtech.nikkei.com/',
    domain: 'xtech.nikkei.com',
    source_type: 'secondary',
    credibility_score: 8,
    verification_level: 'editorial',
    entity_kind: 'japanese_media',
    locale: 'ja',
    region: 'jp',
    is_active: true,
    is_newsletter: false,
    is_japanese_media: true,
    newsletter_from_email: null,
    newsletter_archive_url: null,
    description: 'Japanese trusted media for localization and domestic context.',
    notes: 'Priority JP media source.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function toBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

function filterFallback(sources: SourceEntity[], request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const entityKind = params.get('entity_kind');
  const locale = params.get('locale');
  const sourceType = params.get('source_type');
  const active = toBoolean(params.get('active'));
  const newsletterOnly = toBoolean(params.get('newsletter_only'));

  return sources.filter((source) => {
    if (entityKind && source.entity_kind !== entityKind) return false;
    if (locale && source.locale !== locale) return false;
    if (sourceType && source.source_type !== sourceType) return false;
    if (active !== undefined && source.is_active !== active) return false;
    if (newsletterOnly === true && !source.is_newsletter) return false;
    return true;
  });
}

export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({
      sources: filterFallback(FALLBACK_SOURCES, request),
      note: 'Using fallback data because database credentials are unavailable.',
    });
  }

  const params = request.nextUrl.searchParams;
  const entityKind = params.get('entity_kind');
  const locale = params.get('locale');
  const sourceType = params.get('source_type');
  const active = toBoolean(params.get('active'));
  const newsletterOnly = toBoolean(params.get('newsletter_only'));

  try {
    let query = supabase
      .from('sources')
      .select('*')
      .order('entity_kind', { ascending: true })
      .order('credibility_score', { ascending: false })
      .order('name', { ascending: true });

    if (entityKind) query = query.eq('entity_kind', entityKind);
    if (locale) query = query.eq('locale', locale);
    if (sourceType) query = query.eq('source_type', sourceType);
    if (active !== undefined) query = query.eq('is_active', active);
    if (newsletterOnly === true) query = query.eq('is_newsletter', true);

    const { data, error } = await query;

    if (error) {
      console.error('[admin/source-intelligence] GET failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to load source entities. Did you run the latest migration?',
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ sources: data ?? [] });
  } catch (error) {
    console.error('[admin/source-intelligence] GET exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<SourceEntity>;

    if (!body.name || !body.url || !body.domain || !body.source_type) {
      return NextResponse.json(
        { error: 'name, url, domain, source_type are required.' },
        { status: 400 }
      );
    }

    const payload = {
      name: body.name,
      url: body.url,
      domain: body.domain,
      source_type: body.source_type,
      credibility_score: body.credibility_score ?? 5,
      verification_level: body.verification_level ?? null,
      entity_kind: body.entity_kind ?? 'global_media',
      locale: body.locale ?? 'en',
      region: body.region ?? 'global',
      is_active: body.is_active ?? true,
      is_newsletter: body.is_newsletter ?? false,
      is_japanese_media: body.is_japanese_media ?? false,
      newsletter_from_email: body.newsletter_from_email ?? null,
      newsletter_archive_url: body.newsletter_archive_url ?? null,
      description: body.description ?? null,
      notes: body.notes ?? null,
    };

    const { data, error } = await supabase
      .from('sources')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/source-intelligence] POST failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source: data }, { status: 201 });
  } catch (error) {
    console.error('[admin/source-intelligence] POST exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<SourceEntity> & { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const updates = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.url !== undefined ? { url: body.url } : {}),
      ...(body.domain !== undefined ? { domain: body.domain } : {}),
      ...(body.source_type !== undefined ? { source_type: body.source_type } : {}),
      ...(body.credibility_score !== undefined ? { credibility_score: body.credibility_score } : {}),
      ...(body.verification_level !== undefined ? { verification_level: body.verification_level } : {}),
      ...(body.entity_kind !== undefined ? { entity_kind: body.entity_kind } : {}),
      ...(body.locale !== undefined ? { locale: body.locale } : {}),
      ...(body.region !== undefined ? { region: body.region } : {}),
      ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
      ...(body.is_newsletter !== undefined ? { is_newsletter: body.is_newsletter } : {}),
      ...(body.is_japanese_media !== undefined ? { is_japanese_media: body.is_japanese_media } : {}),
      ...(body.newsletter_from_email !== undefined
        ? { newsletter_from_email: body.newsletter_from_email }
        : {}),
      ...(body.newsletter_archive_url !== undefined
        ? { newsletter_archive_url: body.newsletter_archive_url }
        : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };

    const { data, error } = await supabase
      .from('sources')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/source-intelligence] PUT failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source: data });
  } catch (error) {
    console.error('[admin/source-intelligence] PUT exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database credentials are not configured.' },
      { status: 503 }
    );
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const { error } = await supabase.from('sources').delete().eq('id', id);

    if (error) {
      console.error('[admin/source-intelligence] DELETE failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/source-intelligence] DELETE exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
