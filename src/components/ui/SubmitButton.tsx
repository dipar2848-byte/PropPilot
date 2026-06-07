'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { SpinnerIcon } from '@/components/ui/Icons';

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function SubmitButton({
  children,
  className,
  pendingText,
  variant = 'primary',
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const variantClass =
    variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'danger'
        ? 'btn-danger'
        : 'btn-primary';

  return (
    <button type="submit" className={cn(variantClass, className)} disabled={pending} aria-busy={pending}>
      {pending && <SpinnerIcon className="h-4 w-4" />}
      {pending ? (pendingText ?? 'Working…') : children}
    </button>
  );
}
