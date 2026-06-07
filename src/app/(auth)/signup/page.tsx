import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Create your account',
};

export default function SignupPage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-ink-900">Create your account</h2>
      <p className="mt-1 text-sm text-ink-500">Start managing and marketing properties today.</p>

      <div className="mt-6">
        <SignupForm />
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
