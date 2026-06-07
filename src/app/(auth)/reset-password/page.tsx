import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Set a new password',
};

export default function ResetPasswordPage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-ink-900">Set a new password</h2>
      <p className="mt-1 text-sm text-ink-500">
        Choose a strong password you haven&apos;t used before.
      </p>

      <div className="mt-6">
        <ResetPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
