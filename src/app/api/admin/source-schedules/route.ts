import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/admin-supabase';

export const dynamic = 'force-dynamic';

interface SourceSchedule {
  id: string;
  source_id: string;
  schedule_name: string;
  timezone: string;
  delivery_hour: number;
  delivery_minute: number;
  delivery_days: number[];
  fetch_delay_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SourceSummary {
  id: string;
  name: string;
  domain: string | null;
  entity_kind: string | null;
  is_newsletter: boolean | null;
  is_active: boolean | null;
}

interface SourceScheduleWithSource extends SourceSchedule {
  source?: SourceSummary | null;
}

interface RawSourceScheduleWithSource extends SourceSchedule {
  source?: SourceSummary[] | SourceSummary | null;
}

function toBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      schedules: [],
      note: 'Database credentials are not configured.',
    });
  }

  const params = request.nextUrl.searchParams;
  const sourceId = params.get('source_id');
  const active = toBoolean(params.get('active'));
  const newsletterOnly = toBoolean(params.get('newsletter_only'));

  try {
    const { data: schedules, error } = await supabase
      .from('source_delivery_schedules')
      .select(`
        id,
        source_id,
        schedule_name,
        timezone,
        delivery_hour,
        delivery_minute,
        delivery_days,
        fetch_delay_minutes,
        is_active,
        created_at,
        updated_at,
        source:sources (
          id,
          name,
          domain,
          entity_kind,
          is_newsletter,
          is_active
        )
      `)
      .order('delivery_hour', { ascending: true })
      .order('delivery_minute', { ascending: true })
      .order('schedule_name', { ascending: true });

    if (error) {
      console.error('[admin/source-schedules] GET failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to load schedules. Did you run the latest migration?',
          detail: error.message,
        },
        { status: 500 }
      );
    }

    const normalized = (((schedules ?? []) as unknown as RawSourceScheduleWithSource[]) ?? []).map(
      (row): SourceScheduleWithSource => ({
        ...row,
        source: Array.isArray(row.source) ? (row.source[0] ?? null) : (row.source ?? null),
      })
    );

    const filtered = normalized.filter((row) => {
      if (sourceId && row.source_id !== sourceId) return false;
      if (active !== undefined && row.is_active !== active) return false;
      if (newsletterOnly === true && !row.source?.is_newsletter) return false;
      return true;
    });

    return NextResponse.json({ schedules: filtered });
  } catch (error) {
    console.error('[admin/source-schedules] GET exception:', error);
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
    const body = (await request.json()) as Partial<SourceSchedule>;

    if (!body.source_id || !body.schedule_name) {
      return NextResponse.json(
        { error: 'source_id and schedule_name are required.' },
        { status: 400 }
      );
    }

    const payload = {
      source_id: body.source_id,
      schedule_name: body.schedule_name,
      timezone: body.timezone ?? 'Asia/Tokyo',
      delivery_hour: body.delivery_hour ?? 9,
      delivery_minute: body.delivery_minute ?? 0,
      delivery_days: body.delivery_days ?? [1, 2, 3, 4, 5],
      fetch_delay_minutes: body.fetch_delay_minutes ?? 20,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('source_delivery_schedules')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/source-schedules] POST failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schedule: data }, { status: 201 });
  } catch (error) {
    console.error('[admin/source-schedules] POST exception:', error);
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
    const body = (await request.json()) as Partial<SourceSchedule> & { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    const updates = {
      ...(body.schedule_name !== undefined ? { schedule_name: body.schedule_name } : {}),
      ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
      ...(body.delivery_hour !== undefined ? { delivery_hour: body.delivery_hour } : {}),
      ...(body.delivery_minute !== undefined ? { delivery_minute: body.delivery_minute } : {}),
      ...(body.delivery_days !== undefined ? { delivery_days: body.delivery_days } : {}),
      ...(body.fetch_delay_minutes !== undefined
        ? { fetch_delay_minutes: body.fetch_delay_minutes }
        : {}),
      ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
    };

    const { data, error } = await supabase
      .from('source_delivery_schedules')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/source-schedules] PUT failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schedule: data });
  } catch (error) {
    console.error('[admin/source-schedules] PUT exception:', error);
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

    const { error } = await supabase
      .from('source_delivery_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/source-schedules] DELETE failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/source-schedules] DELETE exception:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
