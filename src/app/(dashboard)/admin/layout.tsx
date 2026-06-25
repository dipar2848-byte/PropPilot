import { requireAdmin } from '@/lib/data/admin';

/**
 * Admin section guard. Runs requireAdmin() for EVERY route under /admin — a
 * non-admin (or unauthenticated) visitor is redirected away before any admin
 * page renders. The frontend is never trusted; this is server-side enforcement.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
