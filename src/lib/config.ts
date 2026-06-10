// ============================================================================
// PropPilot — Centralized Application Branding & Config (APP_CONFIG)
// ============================================================================
// Single source of truth for the application's brand identity. NEVER hardcode
// the brand name elsewhere — always import APP_CONFIG and use APP_CONFIG.name.
//
// Sources that must use this: website metadata, dashboard, emails,
// notifications, PDFs, landing pages, PWA manifest and Open Graph tags.
//
// Changing the brand name should require changing ONLY the value below
// (or the NEXT_PUBLIC_APP_NAME environment variable).
// ============================================================================

const RAW_NAME = (process.env.NEXT_PUBLIC_APP_NAME ?? 'PropPilot').trim() || 'PropPilot';

export const APP_CONFIG = {
  /** Canonical product name used everywhere. */
  name: RAW_NAME,
  /** One-line tagline used on marketing surfaces. */
  tagline: 'The AI-powered real estate operating system',
  /** Short description used for metadata / manifest. */
  description:
    'Enter a property once and instantly generate listings, ads, social content, landing pages and leads — all from one AI-generated Master Kit.',
  /** Default from-name shown on outbound emails. */
  emailFromName: RAW_NAME,
} as const;

export type AppConfig = typeof APP_CONFIG;
