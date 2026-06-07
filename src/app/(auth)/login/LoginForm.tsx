'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction, type ActionState } from '../actions';
import { SubmitButton } from '@/components/ui/SubmitButton';

const initial: ActionState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(signInAction, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="redirect" value={redirectTo ?? '/dashboard'} />

      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@agency.com"
        />
        {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="label">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
        {state.fieldErrors?.password && (
          <p className="field-error">{state.fieldErrors.password}</p>
        )}
      </div>

      <SubmitButton className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
