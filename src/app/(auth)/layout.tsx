import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0, transparent 35%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0, transparent 40%)',
          }}
        />
        <div className="relative">
          <Link href="/" className="inline-flex">
            <Logo className="[&_span:last-child]:text-white [&_span_span]:text-brand-200" />
          </Link>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Sell properties faster with AI-powered marketing.
          </h1>
          <p className="mt-4 text-brand-100">
            Manage your listings, generate complete marketing kits in seconds and publish
            stunning property landing pages — all from one premium dashboard.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            <li className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">✓</span>
              Unlimited property listings
            </li>
            <li className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">✓</span>
              One-click AI marketing kits
            </li>
            <li className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">✓</span>
              Public, SEO-ready landing pages
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} PropPilot. All rights reserved.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-ink-50 p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
