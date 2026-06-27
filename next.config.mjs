import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHost = '';

try {
  if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
} catch {
  supabaseHost = '';
}

const remotePatterns = [
  {
    protocol: 'https',
    hostname: '*.supabase.co',
  },
];

if (supabaseHost && !supabaseHost.endsWith('.supabase.co')) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHost,
  });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },

  images: {
    remotePatterns,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// Sentry (Phase 8). Wraps the existing config without changing it. Source-map
// upload only runs when SENTRY_AUTH_TOKEN + org/project are set (CI); otherwise
// this is a transparent pass-through so local/dev builds are unaffected.
// ---------------------------------------------------------------------------
const sentryEnabled =
  !!process.env.SENTRY_AUTH_TOKEN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT;

// Apply the Sentry webpack wrapper only when monitoring is actually configured
// for this deployment (DSN + org/project/token), or when explicitly forced via
// SENTRY_WEBPACK_PLUGIN=1. This keeps memory-constrained local/CI validation
// builds lightweight (matching the un-instrumented footprint) while production
// builds — which set the Sentry env vars — get the full instrumentation,
// source-map upload, ad-blocker tunnel, and error monitoring.
const applySentryWebpack =
  process.env.SENTRY_WEBPACK_PLUGIN === '1' ||
  (!!process.env.NEXT_PUBLIC_SENTRY_DSN && sentryEnabled);

export default applySentryWebpack
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      // Skip source-map upload entirely when not fully configured (no secrets).
      sourcemaps: { disable: !sentryEnabled },
      // Tunnel browser events through the app to dodge ad-blockers.
      tunnelRoute: '/monitoring',
      disableLogger: true,
      // Avoid build-time network calls when monitoring isn't configured.
      telemetry: false,
      widenClientFileUpload: true,
    })
  : nextConfig;