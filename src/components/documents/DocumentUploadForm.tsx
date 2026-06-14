'use client';

import { useActionState, useEffect, useRef } from 'react';
import {
  uploadDocumentAction,
  type DocumentActionState,
} from '@/app/(dashboard)/properties/[id]/documents/actions';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { DOCUMENT_TYPES } from '@/lib/types';
import { documentTypeLabel } from '@/lib/utils';

const initial: DocumentActionState = {};

export function DocumentUploadForm({
  propertyId,
  atLimit,
  remaining,
}: {
  propertyId: string;
  atLimit: boolean;
  remaining: number;
}) {
  const [state, formAction] = useActionState(uploadDocumentAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  if (atLimit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        You&apos;ve reached the limit of 5 documents for this property. Delete a document to
        upload a new one.
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="label">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="input"
            placeholder="e.g. Sale agreement"
          />
          {state.fieldErrors?.title && <p className="field-error">{state.fieldErrors.title}</p>}
        </div>
        <div>
          <label htmlFor="document_type" className="label">
            Type
          </label>
          <select id="document_type" name="document_type" className="input" defaultValue="other">
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {documentTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="file" className="label">
          File <span className="text-rose-500">*</span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
        <p className="mt-1 text-xs text-ink-400">
          PDF, JPG, PNG or WEBP · up to 25MB · {remaining} slot{remaining === 1 ? '' : 's'} left
        </p>
        {state.fieldErrors?.file && <p className="field-error">{state.fieldErrors.file}</p>}
      </div>

      <SubmitButton className="btn-primary">Upload document</SubmitButton>
    </form>
  );
}
