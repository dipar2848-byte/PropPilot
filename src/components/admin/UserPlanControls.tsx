'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setUserPlanAction } from '@/app/(dashboard)/admin/actions';
import { useToast } from '@/components/ui/Toast';
import { SpinnerIcon } from '@/components/ui/Icons';

export function UserPlanControls({
  userId,
  isPro,
  isSelf,
}: {
  userId: string;
  isPro: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function run(action: 'grant' | 'revoke') {
    if (action === 'revoke' && isSelf) {
      if (!confirm('You are about to revoke Pro from YOUR OWN account. Continue?')) return;
    }
    const fd = new FormData();
    fd.set('userId', userId);
    fd.set('action', action);
    fd.set('months', '1');

    startTransition(async () => {
      const res = await setUserPlanAction(undefined, fd);
      toast(res.message, res.ok ? 'success' : 'error');
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {pending && <SpinnerIcon className="h-4 w-4 text-ink-400" />}
      {isPro ? (
        <button
          type="button"
          onClick={() => run('revoke')}
          disabled={pending}
          className="btn-danger px-3 py-1.5 text-xs"
        >
          Revoke Pro
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run('grant')}
          disabled={pending}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          Grant Pro
        </button>
      )}
    </div>
  );
}
