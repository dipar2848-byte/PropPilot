import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types';

const PUBLIC_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/p/', // public landing pages
];

const PUBLIC_EXACT = ['/', '/manifest.webmanifest', '/sw.js', '/offline'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/icons')) return true;
  if (/\.(png|jpg|jpeg|svg|ico|webp|txt|xml|json|js|css|woff2?)$/.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Refreshes the Supabase session on every request and enforces route
 * protection. Unauthenticated users hitting protected routes are redirected
 * to /login (with a redirect-back param). Authenticated users on auth pages
 * are sent to the dashboard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth screens.
  if (
    user &&
    (pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/forgot-password')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Protect everything that isn't explicitly public.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
