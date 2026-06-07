'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, XIcon } from '@/components/ui/Icons';
import { Logo } from '@/components/ui/Logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'proppilot:install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
  };

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md animate-fade-in rounded-2xl border border-ink-200 bg-white p-4 shadow-soft sm:inset-x-auto sm:right-6">
      <div className="flex items-start gap-3">
        <Logo showText={false} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink-900">Install PropPilot</p>
          <p className="mt-0.5 text-xs text-ink-500">
            Add to your home screen for instant, app-like access.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={install} className="btn-primary px-3 py-1.5 text-xs">
              <PlusIcon className="h-4 w-4" /> Install
            </button>
            <button onClick={dismiss} className="btn-ghost px-3 py-1.5 text-xs">
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-ink-400 hover:text-ink-600">
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
