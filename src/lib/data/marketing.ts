import { requireUser } from '@/lib/data/properties';
import type { Property, PropertyImage } from '@/lib/types';

export interface MarketingListItem {
  property: Property;
  cover_url: string | null;
  has_marketing: boolean;
  provider: string | null;
  updated_at: string | null;
}

type MarketingMini = { provider: string; updated_at: string };

interface Row extends Property {
  property_images: Pick<PropertyImage, 'image_url' | 'position' | 'is_cover'>[];
  // to-one but PostgREST may serialise as an array when embedded from the parent.
  marketing_assets: MarketingMini | MarketingMini[] | null;
}

/** Normalise a PostgREST embedded to-one relation (object or array) to a single value. */
function toOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

/**
 * Lists all properties with the state of their marketing kit. Useful for the
 * Marketing Kits index where the agent generates/regenerates copy per property.
 */
export async function listMarketing(): Promise<MarketingListItem[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('properties')
    .select(
      `*,
       property_images ( image_url, position, is_cover ),
       marketing_assets ( provider, updated_at )`,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as unknown as Row[]).map((row) => {
    const images = row.property_images ?? [];
    const cover =
      images.find((i) => i.is_cover) ??
      images.slice().sort((a, b) => a.position - b.position)[0] ??
      null;
    const marketing = toOne<MarketingMini>(row.marketing_assets);
    const { property_images, marketing_assets, ...property } = row;
    void property_images;
    void marketing_assets;
    return {
      property: property as Property,
      cover_url: cover?.image_url ?? null,
      has_marketing: !!marketing,
      provider: marketing?.provider ?? null,
      updated_at: marketing?.updated_at ?? null,
    };
  });
}
