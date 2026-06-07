'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckIcon, XIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = ++counter;
      setItems((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-soft animate-fade-in',
              t.variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
              t.variant === 'error' && 'border-rose-200 bg-rose-50 text-rose-800',
              t.variant === 'info' && 'border-brand-200 bg-brand-50 text-brand-800',
            )}
          >
            <span className="mt-0.5">
              {t.variant === 'error' ? (
                <XIcon className="h-4 w-4" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
            </span>
            <span className="flex-1 font-medium">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="text-current/60 hover:text-current"
              aria-label="Dismiss"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
