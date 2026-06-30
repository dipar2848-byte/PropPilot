// ============================================================================
// PropPilot — Export response helpers (Phase 9)
// ============================================================================
import { NextResponse } from 'next/server';
import { exportFilename } from '@/lib/export/csv';

/** Build a downloadable CSV HTTP response with the right headers. */
export function csvResponse(csv: string, kind: string): NextResponse {
  const filename = exportFilename(kind);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Exports are private, per-user data — never cache.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

/** Standard 401 for unauthenticated export requests. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
