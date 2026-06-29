// ============================================================================
// PropPilot — Properties CSV export (Phase 9)
// ============================================================================
// GET /api/export/properties → downloads the authenticated user's properties as
// CSV. Owner-scoped via RLS + an explicit user_id filter in the data layer.

import { createClient } from '@/lib/supabase/server';
import { getAllPropertiesForExport } from '@/lib/export/data';
import { toCsv } from '@/lib/export/csv';
import { PROPERTY_COLUMNS } from '@/lib/export/columns';
import { csvResponse, unauthorized } from '@/lib/export/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const properties = await getAllPropertiesForExport();
  const csv = toCsv(properties, PROPERTY_COLUMNS);
  return csvResponse(csv, 'properties');
}
