'use client';

import { useState } from 'react';
import { signOutAction } from '@/app/(auth)/actions';
import { SidebarNav } from '@/components/dashboard/Sidebar';
import { Logo } from '@/components/ui/Logo';
import { LogoutIcon, MenuIcon, XIcon } from '@/components/ui/Icons';

export function Topbar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const initial = email.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-ghost -ml-2 p-2 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo showText={false} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink-900">{email}</p>
            <p className="text-xs text-ink-400">Agent workspace</p>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {initial}
          </div>
          <form action={signOutAction}>
            <button type="submit" className="btn-ghost p-2" aria-label="Sign out" title="Sign out">
              <LogoutIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl animate-fade-in">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 btn-ghost p-2"
              aria-label="Close menu"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
