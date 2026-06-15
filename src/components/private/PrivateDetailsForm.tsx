'use client';

import { useActionState } from 'react';
import {
  savePrivateDetailsAction,
  type PrivateDetailsActionState,
} from '@/app/(dashboard)/properties/[id]/private/actions';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { COMMISSION_TYPES } from '@/lib/types';
import type { PropertyPrivateDetails } from '@/lib/types';

const initial: PrivateDetailsActionState = {};

function val(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : String(n);
}

export function PrivateDetailsForm({
  propertyId,
  details,
}: {
  propertyId: string;
  details: PropertyPrivateDetails | null;
}) {
  const [state, formAction] = useActionState(savePrivateDetailsAction, initial);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="propertyId" value={propertyId} />

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

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-900">Owner contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="owner_name" className="label">Owner name</label>
            <input id="owner_name" name="owner_name" type="text" className="input"
              defaultValue={details?.owner_name ?? ''} placeholder="Actual owner" />
          </div>
          <div>
            <label htmlFor="owner_phone" className="label">Owner phone</label>
            <input id="owner_phone" name="owner_phone" type="tel" className="input"
              defaultValue={details?.owner_phone ?? ''} placeholder="+91…" />
            {state.fieldErrors?.owner_phone && <p className="field-error">{state.fieldErrors.owner_phone}</p>}
          </div>
          <div>
            <label htmlFor="owner_email" className="label">Owner email</label>
            <input id="owner_email" name="owner_email" type="email" className="input"
              defaultValue={details?.owner_email ?? ''} placeholder="owner@example.com" />
            {state.fieldErrors?.owner_email && <p className="field-error">{state.fieldErrors.owner_email}</p>}
          </div>
          <div>
            <label htmlFor="alternate_contact" className="label">Alternate contact</label>
            <input id="alternate_contact" name="alternate_contact" type="text" className="input"
              defaultValue={details?.alternate_contact ?? ''} placeholder="Relative / manager" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-900">Commission</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="commission_type" className="label">Commission type</label>
            <select id="commission_type" name="commission_type" className="input"
              defaultValue={details?.commission_type ?? 'percentage'}>
              {COMMISSION_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'percentage' ? 'Percentage (%)' : 'Fixed amount'}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="commission_percentage" className="label">Commission %</label>
            <input id="commission_percentage" name="commission_percentage" type="number" step="0.001" min="0"
              className="input" defaultValue={val(details?.commission_percentage)} placeholder="e.g. 2" />
            {state.fieldErrors?.commission_percentage && <p className="field-error">{state.fieldErrors.commission_percentage}</p>}
          </div>
          <div>
            <label htmlFor="commission_amount" className="label">Commission amount</label>
            <input id="commission_amount" name="commission_amount" type="number" step="0.01" min="0"
              className="input" defaultValue={val(details?.commission_amount)} placeholder="Fixed ₹ amount" />
            {state.fieldErrors?.commission_amount && <p className="field-error">{state.fieldErrors.commission_amount}</p>}
          </div>
          <div>
            <label htmlFor="expected_commission" className="label">Expected commission</label>
            <input id="expected_commission" name="expected_commission" type="number" step="0.01" min="0"
              className="input" defaultValue={val(details?.expected_commission)} placeholder="Projected ₹" />
            {state.fieldErrors?.expected_commission && <p className="field-error">{state.fieldErrors.expected_commission}</p>}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink-900">Deal</legend>
        <div>
          <label htmlFor="deal_stage" className="label">Deal stage</label>
          <input id="deal_stage" name="deal_stage" type="text" className="input"
            defaultValue={details?.deal_stage ?? ''} placeholder="e.g. Negotiation, Token received, Closed" />
        </div>
        <div>
          <label htmlFor="internal_notes" className="label">Internal notes</label>
          <textarea id="internal_notes" name="internal_notes" rows={5} className="input"
            defaultValue={details?.internal_notes ?? ''}
            placeholder="Private notes — never shown publicly." />
          {state.fieldErrors?.internal_notes && <p className="field-error">{state.fieldErrors.internal_notes}</p>}
        </div>
      </fieldset>

      <SubmitButton className="btn-primary">Save private details</SubmitButton>
    </form>
  );
}
