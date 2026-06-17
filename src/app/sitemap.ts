import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

export const revalidate = 3600;

/**
 * Public sitemap. Lists the marketing home page and all published landing
 * pages. Uses the anon key directly (read-only) since landing_pages are
 * publicly selectable by RLS.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ];

  if (publicEnv.supabaseUrl && publicEnv.supabaseAnonKey) {
    try {
      const supabase = createClient<Database>(
        publicEnv.supabaseUrl,
        publicEnv.supabaseAnonKey,
        { auth: { persistSession: false } },
      );
      const { data } = await supabase
        .from('landing_pages')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(5000);

      const cleanBase = base.replace(/\/+$/, '');
      for (const row of data ?? []) {
        // Defensive: never emit "/p/undefined" or "/p/" for legacy/null slugs.
        if (!row.slug || row.slug.trim() === '') continue;
        entries.push({
          url: `${cleanBase}/p/${row.slug}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    } catch (err) {
      console.error('sitemap generation failed:', err);
    }
  }

  return entries;
}
