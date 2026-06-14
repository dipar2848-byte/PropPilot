import type { PropertyType, PropertyStatus } from '@/lib/types';

/** Tailwind-friendly className combiner. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  villa: 'Villa',
  townhouse: 'Townhouse',
  studio: 'Studio',
  penthouse: 'Penthouse',
  plot: 'Plot / Land',
  commercial: 'Commercial',
  office: 'Office',
  retail: 'Retail',
  warehouse: 'Warehouse',
  other: 'Other',
};

export function propertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPE_LABELS[type] ?? 'Property';
}

const STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'Draft',
  available: 'Available',
  under_offer: 'Under Offer',
  sold: 'Sold',
  rented: 'Rented',
  archived: 'Archived',
};

export function statusLabel(status: PropertyStatus): string {
  return STATUS_LABELS[status] ?? status;
}

const STATUS_CLASSES: Record<PropertyStatus, string> = {
  draft: 'bg-ink-100 text-ink-700',
  available: 'bg-emerald-100 text-emerald-700',
  under_offer: 'bg-amber-100 text-amber-700',
  sold: 'bg-rose-100 text-rose-700',
  rented: 'bg-sky-100 text-sky-700',
  archived: 'bg-ink-100 text-ink-500',
};

export function statusBadgeClass(status: PropertyStatus): string {
  return STATUS_CLASSES[status] ?? 'bg-ink-100 text-ink-700';
}

/** Format a number as currency. Defaults to USD; pass a different code if needed. */
export function formatPrice(
  value: number | null | undefined,
  currency = 'USD',
  locale = 'en-US',
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${Math.round(value).toLocaleString()}`;
  }
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatArea(value: number | null | undefined, unit = 'sq ft'): string {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return '—';
  return `${formatNumber(value)} ${unit}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/** Build a URL-safe slug from a property title plus a short unique suffix. */
export function buildSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `property-${suffix}`;
}

/** Sanitise a filename for storage. */
export function sanitiseFileName(name: string): string {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const stem = name.slice(0, name.length - ext.length);
  const clean = stem
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
  const unique = Math.random().toString(36).slice(2, 8);
  return `${clean || 'image'}-${Date.now()}-${unique}${ext.toLowerCase() || '.jpg'}`;
}

export function truncate(text: string, length: number): string {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function formatBytes(bytes: number | null | undefined): string {
  const n = Number(bytes ?? 0);
  if (!n || n <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  agreement: 'Agreement',
  floor_plan: 'Floor plan',
  brochure: 'Brochure',
  legal: 'Legal',
  identity: 'Identity',
  other: 'Other',
};

export function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? 'Other';
}
