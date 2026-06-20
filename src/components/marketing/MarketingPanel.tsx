'use client';

import { useTransition, useState } from 'react';
import type { MarketingAsset } from '@/lib/types';
import { generateMarketingAction } from '@/app/(dashboard)/properties/actions';
import { CopyButton } from '@/components/ui/CopyButton';
import { SparklesIcon, SpinnerIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

interface Section {
  key: keyof Pick<
    MarketingAsset,
    | 'long_description'
    | 'short_description'
    | 'instagram_caption'
    | 'facebook_post'
    | 'linkedin_post'
    | 'whatsapp_message'
  >;
  label: string;
  description: string;
}

const SECTIONS: Section[] = [
  { key: 'long_description', label: 'Long listing description', description: 'Full marketing description for portals and brochures.' },
  { key: 'short_description', label: 'Short description', description: 'One-liner for cards and previews.' },
  { key: 'instagram_caption', label: 'Instagram caption', description: 'Caption with hashtags and emojis.' },
  { key: 'facebook_post', label: 'Facebook post', description: 'Community-friendly post with a call to action.' },
  { key: 'linkedin_post', label: 'LinkedIn post', description: 'Professional tone for investors.' },
  { key: 'whatsapp_message', label: 'WhatsApp message', description: 'Personable outreach message.' },
];

export function MarketingPanel({
  propertyId,
  marketing,
  aiDisabled = false,
  aiUsageLabel,
}: {
  propertyId: string;
  marketing: MarketingAsset | null;
  aiDisabled?: boolean;
  aiUsageLabel?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<MarketingAsset | null>(marketing);
  const { toast } = useToast();

  function generate() {
    startTransition(async () => {
      const res = await generateMarketingAction(propertyId);
      if (res.error) {
        toast(res.error, 'error');
        return;
      }
      toast(data ? 'Marketing kit regenerated' : 'Marketing kit generated', 'success');
      // Refresh server data by reloading the route segment.
      window.location.reload();
    });
  }

  if (!data) {
    return (
      <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <SparklesIcon className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-ink-900">No marketing kit yet</h3>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          Generate a complete set of marketing copy — listing descriptions and social posts —
          tailored to this property.
        </p>
        <button
          onClick={generate}
          disabled={pending || aiDisabled}
          className="btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-60"
          title={aiDisabled ? 'Monthly AI generation limit reached' : undefined}
        >
          {pending ? <SpinnerIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
          {pending ? 'Generating…' : 'Generate marketing kit'}
        </button>
        {aiUsageLabel && <p className="mt-3 text-xs text-ink-400">{aiUsageLabel}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Marketing kit</h3>
          <p className="text-xs text-ink-400">
            Generated with {data.provider === 'template' ? 'PropPilot engine' : data.provider}.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={generate}
            disabled={pending || aiDisabled}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            title={aiDisabled ? 'Monthly AI generation limit reached' : undefined}
          >
            {pending ? <SpinnerIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
            {pending ? 'Regenerating…' : 'Regenerate'}
          </button>
          {aiUsageLabel && <p className="text-xs text-ink-400">{aiUsageLabel}</p>}
        </div>
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((s) => {
          const value = (data[s.key] as string) ?? '';
          return (
            <div key={s.key} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-ink-900">{s.label}</h4>
                  <p className="text-xs text-ink-400">{s.description}</p>
                </div>
                <CopyButton text={value} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {value || '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
