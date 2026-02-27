import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';
import { translateTitlesToJapanese } from '@/lib/title-translation';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectedItemUpdate {
  id: string;
  status?: 'new' | 'scored' | 'selected' | 'dismissed' | 'published';
  title_ja?: string | null;
  nva_social?: number;
  nva_media?: number;
  nva_community?: number;
  nva_technical?: number;
  nva_solo_relevance?: number;
  nva_total?: number;
  classification?: string;
  relevance_tags?: string[];
  score_reasoning?: string;
  digest_date?: string;
  content_id?: string;
}

type AdminSupabaseClient = NonNullable<ReturnType<typeof getAdminSupabaseClient>>;

interface CollectedItemTitleFields {
  id: string;
  title: string;
  title_ja: string | null;
}

function normalizeTitle(value: string | null | undefined): string {
  return (value || '').trim();
}

async function enrichJapaneseTitles<T extends CollectedItemTitleFields>(
  supabase: AdminSupabaseClient,
  items: T[]
): Promise<T[]> {
  const missing = items.filter((item) => normalizeTitle(item.title_ja).length === 0);
  if (missing.length === 0) {
    return items;
  }

  const translated = await translateTitlesToJapanese(missing.map((item) => item.title));
  const updates = missing.map((item, index) => ({
    id: item.id,
    title_ja: translated[index] || item.title,
  }));

  try {
    await Promise.all(
      updates.map((update) =>
        supabase
          .from('collected_items')
          .update({ title_ja: update.title_ja })
          .eq('id', update.id)
      )
    );
  } catch (error) {
    // Keep API resilient if migration is not yet applied.
    console.error('[admin/collected-items] title_ja update failed:', error);
  }

  const titleMap = new Map(updates.map((update) => [update.id, update.title_ja]));
  return items.map((item) => ({
    ...item,
    title_ja: normalizeTitle(item.title_ja) || titleMap.get(item.id) || item.title,
  })) as T[];
}

// ---------------------------------------------------------------------------
// GET: List collected items with filtering and pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const params = request.nextUrl.searchParams;
  const status = params.get('status');
  const tier = params.get('tier');
  const sourceId = params.get('source_id');
  const dateFrom = params.get('date_from');
  const dateTo = params.get('date_to');
  const minScore = params.get('min_score');
  const classification = params.get('classification');
  const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
  const offset = parseInt(params.get('offset') || '0', 10);
  const sortBy = params.get('sort') || 'collected_at';
  const sortOrder = params.get('order') === 'asc' ? true : false;

  try {
    // Build query with source JOIN
    let query = supabase
      .from('collected_items')
      .select(
        `
        *,
        sources!inner (
          id,
          name,
          domain,
          entity_kind,
          source_type,
          credibility_score
        )
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status) query = query.eq('status', status);
    if (tier) query = query.eq('source_tier', tier);
    if (sourceId) query = query.eq('source_id', sourceId);
    if (classification) query = query.eq('classification', classification);

    if (dateFrom) {
      query = query.gte('collected_at', `${dateFrom}T00:00:00Z`);
    }
    if (dateTo) {
      query = query.lte('collected_at', `${dateTo}T23:59:59Z`);
    }
    if (minScore) {
      query = query.gte('nva_total', parseInt(minScore, 10));
    }

    // Sorting
    const validSortColumns = [
      'collected_at',
      'nva_total',
      'scored_at',
      'published_at',
      'title',
      'title_ja',
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'collected_at';

    query = query
      .order(sortColumn, { ascending: sortOrder, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[admin/collected-items] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalizedItems = (
      (data ?? []) as (CollectedItemTitleFields & { sources?: unknown } & Record<string, unknown>)[]
    ).map((item) => {
      const { sources, ...rest } = item;
      return {
        ...rest,
        source: sources,
      };
    });

    const itemsWithJaTitles = await enrichJapaneseTitles(
      supabase,
      normalizedItems
    );

    return NextResponse.json({
      items: itemsWithJaTitles,
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[admin/collected-items] GET exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT: Update a collected item (manual override)
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as CollectedItemUpdate;

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Build update payload, only include provided fields
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.title_ja !== undefined) updates.title_ja = body.title_ja;
    if (body.nva_social !== undefined) updates.nva_social = body.nva_social;
    if (body.nva_media !== undefined) updates.nva_media = body.nva_media;
    if (body.nva_community !== undefined) updates.nva_community = body.nva_community;
    if (body.nva_technical !== undefined) updates.nva_technical = body.nva_technical;
    if (body.nva_solo_relevance !== undefined) updates.nva_solo_relevance = body.nva_solo_relevance;
    if (body.nva_total !== undefined) updates.nva_total = body.nva_total;
    if (body.classification !== undefined) updates.classification = body.classification;
    if (body.relevance_tags !== undefined) updates.relevance_tags = body.relevance_tags;
    if (body.score_reasoning !== undefined) updates.score_reasoning = body.score_reasoning;
    if (body.digest_date !== undefined) updates.digest_date = body.digest_date;
    if (body.content_id !== undefined) updates.content_id = body.content_id;

    // If NVA axes are manually updated, recalculate total if not explicitly provided
    if (body.nva_total === undefined) {
      const axisKeys = [
        'nva_social',
        'nva_media',
        'nva_community',
        'nva_technical',
        'nva_solo_relevance',
      ] as const;
      const hasAxisUpdate = axisKeys.some((k) => body[k] !== undefined);

      if (hasAxisUpdate) {
        // Fetch current values to compute new total
        const { data: current } = await supabase
          .from('collected_items')
          .select('nva_social, nva_media, nva_community, nva_technical, nva_solo_relevance')
          .eq('id', body.id)
          .single();

        if (current) {
          const social = (updates.nva_social as number) ?? current.nva_social ?? 0;
          const media = (updates.nva_media as number) ?? current.nva_media ?? 0;
          const community = (updates.nva_community as number) ?? current.nva_community ?? 0;
          const technical = (updates.nva_technical as number) ?? current.nva_technical ?? 0;
          const soloRelevance =
            (updates.nva_solo_relevance as number) ?? current.nva_solo_relevance ?? 0;

          // Use default weights for recalculation
          const w = { social: 1.0, media: 1.0, community: 1.0, technical: 1.0, solo_relevance: 1.5 };
          const totalWeight = w.social + w.media + w.community + w.technical + w.solo_relevance;
          const weightedSum =
            social * w.social +
            media * w.media +
            community * w.community +
            technical * w.technical +
            soloRelevance * w.solo_relevance;

          updates.nva_total = Math.round((weightedSum / totalWeight) * 5);
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Append reasoning note for manual override
    if (updates.score_reasoning === undefined && Object.keys(updates).some((k) => k.startsWith('nva_'))) {
      updates.score_reasoning = `[manual override] ${new Date().toISOString()}`;
    }

    const { data, error } = await supabase
      .from('collected_items')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/collected-items] PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('[admin/collected-items] PUT exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE: Remove a collected item
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('collected_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/collected-items] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/collected-items] DELETE exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
