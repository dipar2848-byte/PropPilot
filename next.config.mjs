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
  remotePatterns.push({ protocol: 'https', hostname: supabaseHost });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
