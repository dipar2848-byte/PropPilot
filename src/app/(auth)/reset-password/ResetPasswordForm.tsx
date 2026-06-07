'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type ActionState } from '../actions';
import { SubmitButton } from '@/components/ui/SubmitButton';

const initial: ActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="label">
          New password
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

      <SubmitButton className="w-full" pendingText="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
