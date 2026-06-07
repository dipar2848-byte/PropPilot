import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/data/properties';
import type { Property, PropertyImage, LandingPage, PublicLandingData } from '@/lib/types';

export interface LandingListItem {
  landing: LandingPage;
  property: Pick<Property, 'id' | 'title' | 'location' | 'price' | 'property_type' | 'status'>;
  cover_url: string | null;
}

interface Row extends LandingPage {
  properties: (Pick<
    Property,
    'id' | 'title' | 'location' | 'price' | 'property_type' | 'status'
  > & {
    property_images?: Pick<PropertyImage, 'image_url' | 'position' | 'is_cover'>[];
  }) | null;
}

/** Lists every landing page in the user's workspace with property context. */
export async function listLandingPages(): Promise<LandingListItem[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('landing_pages')
    .select(
      `*,
       properties (
         id, title, location, price, property_type, status,
         property_images ( image_url, position, is_cover )
       )`,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as Row[])
    .filter((r) => r.properties)
    .map((r) => {
      const images = r.properties?.property_images ?? [];
      const cover =
        images.find((i) => i.is_cover) ??
        images.slice().sort((a, b) => a.position - b.position)[0] ??
        null;
      const { property_images, ...property } = r.properties!;
      void property_images;
      return {
        landing: {
          id: r.id,
          property_id: r.property_id,
          user_id: r.user_id,
          slug: r.slug,
          public_url: r.public_url,
          is_published: r.is_published,
          created_at: r.created_at,
          updated_at: r.updated_at,
        },
        property,
        cover_url: cover?.image_url ?? null,
      };
    });
}

/**
 * Fetches public landing data for a slug via the SECURITY DEFINER RPC. Works
 * for anonymous visitors. Returns null if the slug is missing/unpublished.
 */
export async function getPublicLanding(slug: string): Promise<PublicLandingData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_public_landing', { p_slug: slug });
  if (error) {
    console.error('get_public_landing failed:', error.message);
    return null;
  }
  return (data as PublicLandingData | null) ?? null;
}
