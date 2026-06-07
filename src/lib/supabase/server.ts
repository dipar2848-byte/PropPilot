import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';
import { getPublicEnv, getServiceRoleKey } from '@/lib/env';

/**
 * Server Supabase client bound to the request cookies. Use inside Server
 * Components, Server Actions and Route Handlers. Respects RLS via the user's
 * session.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies cannot be written.
          // Middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — use ONLY in trusted server contexts
 * (e.g. cleaning up storage objects after a delete). Never expose to clients.
 */
export function createAdminClient() {
  const { supabaseUrl } = getPublicEnv();
  return createSupabaseClient<Database>(supabaseUrl, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
