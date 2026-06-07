import { Logo } from '@/components/ui/Logo';

export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-6">
      <div className="text-center">
        <Logo className="justify-center" />
        <h1 className="mt-8 text-2xl font-bold text-ink-900">You&apos;re offline</h1>
        <p className="mt-2 max-w-sm text-ink-500">
          PropPilot needs an internet connection for this page. Please reconnect and try again.
        </p>
      </div>
    </div>
  );
}
