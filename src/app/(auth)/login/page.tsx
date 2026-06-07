import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-ink-900">Welcome back</h2>
      <p className="mt-1 text-sm text-ink-500">Sign in to your PropPilot dashboard.</p>

      {params.error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Authentication failed. Please sign in again.
        </div>
      )}

      <div className="mt-6">
        <LoginForm redirectTo={params.redirect} />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
