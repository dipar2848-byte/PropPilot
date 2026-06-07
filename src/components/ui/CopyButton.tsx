'use client';

import { useState } from 'react';
import { CopyIcon, CheckIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
        copied
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-ink-100 text-ink-700 hover:bg-ink-200',
        className,
      )}
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}
