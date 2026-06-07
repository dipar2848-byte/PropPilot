import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset your password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-ink-900">Forgot your password?</h2>
      <p className="mt-1 text-sm text-ink-500">
        Enter your email and we&apos;ll send you a secure reset link.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
