'use client';

import { useTransition, useState } from 'react';
import type { LandingPage } from '@/lib/types';
import {
  publishLandingAction,
  unpublishLandingAction,
} from '@/app/(dashboard)/properties/actions';
import { GlobeIcon, SpinnerIcon, ExternalLinkIcon } from '@/components/ui/Icons';
import { CopyButton } from '@/components/ui/CopyButton';
import { useToast } from '@/components/ui/Toast';

export function LandingControls({
  propertyId,
  landing,
  siteUrl,
}: {
  propertyId: string;
  landing: LandingPage | null;
  siteUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<LandingPage | null>(landing);
  const { toast } = useToast();

  const isLive = current?.is_published;
  const publicUrl = current ? `${siteUrl}/p/${current.slug}` : '';

  function publish() {
    startTransition(async () => {
      const res = await publishLandingAction(propertyId);
      if (res.error) {
        toast(res.error, 'error');
        return;
      }
      toast('Landing page published', 'success');
      window.location.reload();
    });
  }

  function unpublish() {
    startTransition(async () => {
      try {
        await unpublishLandingAction(propertyId);
        setCurrent((prev) => (prev ? { ...prev, is_published: false } : prev));
        toast('Landing page unpublished', 'info');
      } catch {
        toast('Could not unpublish', 'error');
      }
    });
  }

  if (!current) {
    return (
      <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <GlobeIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-ink-900">No landing page yet</h3>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          Publish a public, SEO-ready landing page for this property with a gallery, features
          and instant contact options.
        </p>
        <button onClick={publish} disabled={pending} className="btn-primary mt-6">
          {pending ? <SpinnerIcon className="h-4 w-4" /> : <GlobeIcon className="h-4 w-4" />}
          {pending ? 'Publishing…' : 'Publish landing page'}
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-ink-400'}`} />
            {isLive ? 'Live' : 'Unpublished'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <button onClick={unpublish} disabled={pending} className="btn-secondary">
              {pending && <SpinnerIcon className="h-4 w-4" />} Unpublish
            </button>
          ) : (
            <button onClick={publish} disabled={pending} className="btn-primary">
              {pending ? <SpinnerIcon className="h-4 w-4" /> : <GlobeIcon className="h-4 w-4" />}
              Re-publish
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-ink-50 p-3">
        <p className="text-xs font-medium text-ink-400">Public URL</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 truncate text-sm text-ink-700">{publicUrl}</code>
          <CopyButton text={publicUrl} label="Copy" />
          <a
            href={`/p/${current.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" /> Open
          </a>
        </div>
      </div>
    </div>
  );
}
