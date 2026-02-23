import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getDb() {
  if (!client) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SECRET_KEY;

    if (!url) {
      throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required');
    }

    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required');
    }

    client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}
