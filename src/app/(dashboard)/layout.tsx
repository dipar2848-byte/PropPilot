import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SidebarNav } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Resolve admin flag once for nav gating (best-effort; never blocks render).
  let isAdmin = false;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = Boolean(data?.is_admin);
  } catch {
    isAdmin = false;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-ink-50">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink-200 bg-white lg:block">
          <SidebarNav isAdmin={isAdmin} />
        </aside>

        <div className="lg:pl-64">
          <Topbar email={user.email ?? 'Agent'} isAdmin={isAdmin} />
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>

        <InstallPrompt />
      </div>
    </ToastProvider>
  );
}
