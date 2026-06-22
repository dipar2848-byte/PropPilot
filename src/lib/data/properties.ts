import { createClient } from '@/lib/supabase/server';
import type {
  Property,
  PropertyImage,
  MarketingAsset,
  LandingPage,
  PropertyType,
  PropertyStatus,
} from '@/lib/types';

export interface PropertyDetail extends Property {
  images: PropertyImage[];
  marketing: MarketingAsset | null;
  landing: LandingPage | null;
}

export interface DashboardStats {
  totalProperties: number;
  totalLandingPages: number;
  totalMarketingKits: number;
}

export interface SearchFilters {
  q?: string;
  type?: string;
  bedrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
}

/** Returns the authenticated user or throws. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, user };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase, user } = await requireUser();

  const [properties, landing, marketing] = await Promise.all([
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('landing_pages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('marketing_assets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  return {
    totalProperties: properties.count ?? 0,
    totalLandingPages: landing.count ?? 0,
    totalMarketingKits: marketing.count ?? 0,
  };
}

export interface PropertyListItem extends Property {
  cover_url: string | null;
  image_count: number;
  has_marketing: boolean;
  has_landing: boolean;
  landing_slug: string | null;
}

/**
 * Shape returned by the list query. PostgREST embeds one-to-one relations
 * (`marketing_assets`, `landing_pages`) as a single object (or null) and
 * one-to-many relations (`property_images`) as an array. The image rows only
 * contain the columns we explicitly selected.
 */
type ListImage = Pick<PropertyImage, 'id' | 'image_url' | 'position' | 'is_cover'>;

interface PropertyWithJoins extends Property {
  property_images: ListImage[];
  // to-one but PostgREST may serialise as an array — normalise via toOne().
  marketing_assets: { id: string } | { id: string }[] | null;
  landing_pages: { id: string; slug: string } | { id: string; slug: string }[] | null;
}

function toListItem(row: PropertyWithJoins): PropertyListItem {
  const images = row.property_images ?? [];
  const cover =
    images.find((i) => i.is_cover) ??
    images.slice().sort((a, b) => a.position - b.position)[0] ??
    null;
  const landing = toOne<{ id: string; slug: string }>(row.landing_pages);
  const marketing = toOne<{ id: string }>(row.marketing_assets);
  return {
    ...stripJoins(row),
    cover_url: cover?.image_url ?? null,
    image_count: images.length,
    has_marketing: !!marketing,
    has_landing: !!landing,
    landing_slug: landing?.slug ?? null,
  };
}

function stripJoins(row: {
  property_images?: unknown;
  marketing_assets?: unknown;
  landing_pages?: unknown;
} & Property): Property {
  const { property_images, marketing_assets, landing_pages, ...rest } = row;
  void property_images;
  void marketing_assets;
  void landing_pages;
  return rest;
}

/**
 * Normalises a PostgREST embedded to-one relation to a single object or null.
 *
 * When embedding a child table from the PARENT side (e.g. `properties` ->
 * `landing_pages`), PostgREST may return the relation as an ARRAY even though a
 * unique constraint makes it logically to-one. If we naively treat that array
 * as an object, fields like `is_published` read back as `undefined` — which is
 * exactly what caused a freshly-published landing page to render as
 * "Unpublished" after a refresh. This helper makes the read path robust to
 * both shapes without any schema change.
 */
function toOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

export async function listProperties(
  filters: SearchFilters = {},
  limit?: number,
): Promise<PropertyListItem[]> {
  const { supabase, user } = await requireUser();

  let query = supabase
    .from('properties')
    .select(
      `*,
       property_images ( id, image_url, position, is_cover ),
       marketing_assets ( id ),
       landing_pages ( id, slug )`,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const q = filters.q?.trim();
  if (q) {
    // Search across title and location.
    query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%`);
  }
  if (filters.type) query = query.eq('property_type', filters.type as PropertyType);
  if (filters.status) query = query.eq('status', filters.status as PropertyStatus);
  if (filters.bedrooms) {
    const beds = Number(filters.bedrooms);
    if (!Number.isNaN(beds)) query = query.gte('bedrooms', beds);
  }
  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!Number.isNaN(min)) query = query.gte('price', min);
  }
  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!Number.isNaN(max)) query = query.lte('price', max);
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data as unknown as PropertyWithJoins[]).map(toListItem);
}

export async function getProperty(id: string): Promise<PropertyDetail | null> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('properties')
    .select(
      `*,
       property_images ( * ),
       marketing_assets ( * ),
       landing_pages ( * )`,
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as Property & {
    property_images: PropertyImage[] | null;
    // These two are logically to-one but PostgREST may serialise them as arrays
    // when embedded from the parent side — normalise via toOne() below.
    marketing_assets: MarketingAsset | MarketingAsset[] | null;
    landing_pages: LandingPage | LandingPage[] | null;
  };

  const images = (row.property_images ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position);

  return {
    ...stripJoins(row),
    images,
    marketing: toOne<MarketingAsset>(row.marketing_assets),
    landing: toOne<LandingPage>(row.landing_pages),
  };
}
