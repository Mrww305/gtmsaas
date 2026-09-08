// ============================================================
// backend/lib/supabase/server.ts
// Server-side Supabase client (for API routes & Server Actions)
// ============================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client scoped to the current request's cookies.
 * Use this in API routes, Server Actions, and Server Components.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * Creates an admin client that bypasses RLS.
 * USE ONLY for trusted backend operations (workers, cron jobs).
 * NEVER expose this to client-side code.
 */
export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js');

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Service role = bypasses RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Helper: Get the authenticated user from the request.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Helper: Get user's active workspace.
 * Checks workspace_members table for the user's default workspace.
 */
export async function getUserWorkspace(userId: string) {
  const supabase = createSupabaseServerClient();

  const { data: membership, error } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      workspaces(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !membership) {
    return null;
  }

  return {
    workspace: membership.workspaces,
    role: membership.role,
  };
}
