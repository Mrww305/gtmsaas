// ============================================================
// backend/lib/supabase/client.ts
// Browser-side Supabase client (for React components & hooks)
// ============================================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for use in Client Components.
 * Safe to call multiple times — it's memoized.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for hooks
let _client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    _client = createSupabaseBrowserClient();
  }
  return _client;
}
