// ============================================================================
// PropPilot — Export column definitions (Phase 9)
// ============================================================================
// Central, human-friendly CSV column maps for each exportable entity. Keeping
// these here means the route handlers stay thin and the export shape is easy to
// review for accidental leakage of sensitive fields.

import type { CsvColumn } from '@/lib/export/csv';
import type { Property } from '@/lib/types';
import type { LeadExportRow } from '@/lib/export/data';
import { propertyTypeLabel, statusLabel } from '@/lib/utils';

/** Format an ISO timestamp as a stable, locale-independent value for CSV. */
function isoDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export const LEAD_COLUMNS: ReadonlyArray<CsvColumn<LeadExportRow>> = [
  { header: 'Name', value: (l) => l.name },
  { header: 'Phone', value: (l) => l.phone },
  { header: 'Message', value: (l) => l.message },
  { header: 'Status', value: (l) => l.status },
  { header: 'Source', value: (l) => l.source },
  { header: 'Property', value: (l) => l.property_title },
  { header: 'Created At', value: (l) => isoDateTime(l.created_at) },
  { header: 'Updated At', value: (l) => isoDateTime(l.updated_at) },
];

export const PROPERTY_COLUMNS: ReadonlyArray<CsvColumn<Property>> = [
  { header: 'Title', value: (p) => p.title },
  { header: 'Type', value: (p) => propertyTypeLabel(p.property_type) },
  { header: 'Status', value: (p) => statusLabel(p.status) },
  { header: 'Location', value: (p) => p.location },
  { header: 'Price', value: (p) => p.price },
  { header: 'Bedrooms', value: (p) => p.bedrooms },
  { header: 'Bathrooms', value: (p) => p.bathrooms },
  { header: 'Carpet Area (sq ft)', value: (p) => p.carpet_area ?? '' },
  { header: 'Built-up Area (sq ft)', value: (p) => p.built_up_area ?? '' },
  { header: 'Amenities', value: (p) => (p.amenities ?? []).join('; ') },
  { header: 'Created At', value: (p) => isoDateTime(p.created_at) },
  { header: 'Updated At', value: (p) => isoDateTime(p.updated_at) },
];
