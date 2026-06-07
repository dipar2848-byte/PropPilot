'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import {
  HomeIcon,
  BuildingIcon,
  SparklesIcon,
  GlobeIcon,
  SearchIcon,
  PlusIcon,
} from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon, exact: true },
  { href: '/properties', label: 'Properties', icon: BuildingIcon },
  { href: '/search', label: 'Search', icon: SearchIcon },
  { href: '/marketing', label: 'Marketing Kits', icon: SparklesIcon },
  { href: '/landing-pages', label: 'Landing Pages', icon: GlobeIcon },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  function active(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <div className="px-4">
        <Link
          href="/properties/new"
          onClick={onNavigate}
          className="btn-primary w-full"
        >
          <PlusIcon className="h-4 w-4" /> Add property
        </Link>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const isActive = active(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-200 p-4">
        <p className="px-2 text-xs text-ink-400">
          PropPilot · v1.0
        </p>
      </div>
    </div>
  );
}
