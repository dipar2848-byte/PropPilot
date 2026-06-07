'use client';

import { useActionState } from 'react';
import { forgotPasswordAction, type ActionState } from '../actions';
import { SubmitButton } from '@/components/ui/SubmitButton';

const initial: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
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

      <SubmitButton className="w-full" pendingText="Sending link…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
