'use client';

import { useTransition } from 'react';
import {
  deletePropertyAction,
  duplicatePropertyAction,
} from '@/app/(dashboard)/properties/actions';
import { TrashIcon, DuplicateIcon, SpinnerIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

export function PropertyActions({ propertyId }: { propertyId: string }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDuplicate() {
    startTransition(async () => {
      try {
        await duplicatePropertyAction(propertyId);
      } catch {
        toast('Could not duplicate property', 'error');
      }
    });
  }

  function handleDelete() {
    if (!confirm('Delete this property? All images, marketing and landing pages will be removed. This cannot be undone.')) {
      return;
    }
    startTransition(async () => {
      try {
        await deletePropertyAction(propertyId);
      } catch {
        toast('Could not delete property', 'error');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={pending}
        className="btn-secondary"
      >
        {pending ? <SpinnerIcon className="h-4 w-4" /> : <DuplicateIcon className="h-4 w-4" />}
        Duplicate
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="btn-secondary text-rose-600 hover:bg-rose-50"
      >
        <TrashIcon className="h-4 w-4" />
        Delete
      </button>
    </>
  );
}
