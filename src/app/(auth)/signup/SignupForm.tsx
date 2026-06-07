'use client';

import { useActionState } from 'react';
import { signUpAction, type ActionState } from '../actions';
import { SubmitButton } from '@/components/ui/SubmitButton';

const initial: ActionState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state.message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="label">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className="input"
          placeholder="Jordan Rivera"
        />
        {state.fieldErrors?.fullName && (
          <p className="field-error">{state.fieldErrors.fullName}</p>
        )}
      </div>

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
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          placeholder="At least 8 characters"
        />
        {state.fieldErrors?.password && (
          <p className="field-error">{state.fieldErrors.password}</p>
        )}
      </div>

      <SubmitButton className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-xs text-ink-400">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
