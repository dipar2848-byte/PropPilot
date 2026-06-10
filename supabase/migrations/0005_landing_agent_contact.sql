-- ============================================================================
-- PropPilot — Public Landing RPC (v2): include agent contact from profiles
-- ============================================================================
-- Replaces get_public_landing so public landing pages render the property
-- owner's contact details (name / phone / whatsapp / email) sourced from the
-- profiles table — NEVER from environment variables.
--
-- Still SECURITY DEFINER and still exposes ONLY the minimal public fields.
-- Documents and other sensitive data are never returned here.
-- ============================================================================

create or replace function public.get_public_landing(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid;
  v_owner_id    uuid;
  v_result jsonb;
begin
  select lp.property_id, lp.user_id
    into v_property_id, v_owner_id
  from public.landing_pages lp
  where lp.slug = p_slug
    and lp.is_published = true
  limit 1;

  if v_property_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'property', jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'property_type', p.property_type,
      'location', p.location,
      'price', p.price,
      'carpet_area', p.carpet_area,
      'built_up_area', p.built_up_area,
      'bedrooms', p.bedrooms,
      'bathrooms', p.bathrooms,
      'amenities', p.amenities,
      'description', p.description,
      'status', p.status,
      'created_at', p.created_at
    ),
    'images', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pi.id,
            'image_url', pi.image_url,
            'position', pi.position,
            'is_cover', pi.is_cover
          )
          order by pi.is_cover desc, pi.position asc, pi.created_at asc
        )
        from public.property_images pi
        where pi.property_id = p.id
      ),
      '[]'::jsonb
    ),
    'marketing', (
      select jsonb_build_object(
        'long_description', ma.long_description,
        'short_description', ma.short_description,
        'whatsapp_message', ma.whatsapp_message
      )
      from public.marketing_assets ma
      where ma.property_id = p.id
      limit 1
    ),
    'agent', (
      select jsonb_build_object(
        'full_name', pr.full_name,
        'phone', pr.phone,
        'whatsapp_number', pr.whatsapp_number,
        'email', pr.email,
        'agency_name', pr.agency_name,
        'profile_photo_url', pr.profile_photo_url
      )
      from public.profiles pr
      where pr.id = v_owner_id
      limit 1
    )
  )
  into v_result
  from public.properties p
  where p.id = v_property_id;

  return v_result;
end;
$$;

grant execute on function public.get_public_landing(text) to anon, authenticated;
