import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-6">
      <div className="text-center">
        <Logo className="justify-center" />
        <p className="mt-8 text-7xl font-bold text-brand-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">Page not found</h1>
        <p className="mt-2 text-ink-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary mt-8">
          Back to home
        </Link>
      </div>
    </div>
  );
}
