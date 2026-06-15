'use client';

import { useActionState, useState } from 'react';
import { submitPublicLeadAction, type PublicLeadState } from '@/app/leads/actions';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { WhatsAppIcon, CopyIcon, CheckIcon } from '@/components/ui/Icons';

const initial: PublicLeadState = {};

/**
 * Public lead capture form implementing the FINAL mandated flow:
 *
 *   Step 1  User manually enters name / phone / (optional) message.
 *           No phone auto-detection, no device-based extraction.
 *   Step 2  Lead is saved to the DB first (server action). If it fails, STOP.
 *   Step 3  On success we show a confirmation screen (no auto-redirect).
 *   Step 4  A "Continue on WhatsApp" button opens wa.me click-to-chat ONLY on
 *           click. The message is built from the user's OWN submitted values
 *           plus the property title. Pure URL-based click-to-chat — no Meta /
 *           WhatsApp Business API, no webhooks, no server-side messaging.
 *   Step 5  Fallback: copy-to-clipboard + a manual WhatsApp link button.
 */
export function LeadForm({
  slug,
  propertyTitle,
  whatsappNumber,
  disabled = false,
}: {
  slug: string;
  propertyTitle: string;
  whatsappNumber: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(submitPublicLeadAction, initial);
  const [copied, setCopied] = useState(false);

  if (disabled) {
    return (
      <div className="rounded-xl bg-ink-50 p-4 text-center text-sm text-ink-500">
        This property is no longer available for inquiries.
      </div>
    );
  }

  // ----- Step 3+4: success screen with click-to-chat button -----------------
  if (state.ok) {
    const lead = state.lead ?? { name: '', phone: '', message: '' };

    // Build the WhatsApp message from the USER's submitted values + property.
    const lines = [
      `Hi, I'm interested in: ${propertyTitle}`,
      `Name: ${lead.name}`,
      `Phone: ${lead.phone}`,
    ];
    if (lead.message.trim()) lines.push(`Message: ${lead.message.trim()}`);
    const text = lines.join('\n');

    const digits = whatsappNumber.replace(/[^0-9]/g, '');
    const waUrl = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : '';

    function openWhatsApp() {
      if (!waUrl) return;
      // Click-to-chat only. Opening can be blocked (popup blockers / desktop
      // without WhatsApp) — the fallback below always remains available.
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    async function copyMessage() {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }

    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-sm font-semibold text-emerald-800">Thanks — your inquiry was sent!</p>
        <p className="mt-1 text-xs text-emerald-700">
          The agent has your details and will be in touch shortly.
        </p>

        {digits ? (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={openWhatsApp}
              className="btn inline-flex w-full justify-center bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5d]"
            >
              <WhatsAppIcon className="h-4 w-4" /> Continue on WhatsApp
            </button>

            {/* Step 5 fallback: manual link + copy-to-clipboard */}
            <div className="flex items-center gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 justify-center px-3 py-2 text-xs"
              >
                Open link manually
              </a>
              <button
                type="button"
                onClick={copyMessage}
                className="btn-secondary justify-center px-3 py-2 text-xs"
                title="Copy message"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy message'}
              </button>
            </div>
            <p className="text-[11px] text-emerald-700/80">
              If WhatsApp doesn&apos;t open, use the manual link or copy the message above.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // ----- Step 1: the form ---------------------------------------------------
  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="slug" value={slug} />
      {/* Honeypot: hidden from humans, tempting to bots. Must stay empty. */}
      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="lead-name" className="label">
          Your name <span className="text-rose-500">*</span>
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          required
          className="input"
          placeholder="Full name"
          autoComplete="name"
        />
        {state.fieldErrors?.name && <p className="field-error">{state.fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="lead-phone" className="label">
          Phone <span className="text-rose-500">*</span>
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          className="input"
          placeholder="+91 98765 43210"
          autoComplete="tel"
        />
        {state.fieldErrors?.phone && <p className="field-error">{state.fieldErrors.phone}</p>}
      </div>

      <div>
        <label htmlFor="lead-message" className="label">
          Message <span className="text-ink-300">(optional)</span>
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={3}
          className="input"
          placeholder="I'm interested in this property…"
        />
        {state.fieldErrors?.message && <p className="field-error">{state.fieldErrors.message}</p>}
      </div>

      <SubmitButton className="w-full" pendingText="Sending…">
        Send inquiry
      </SubmitButton>
      <p className="text-center text-[11px] text-ink-400">
        Your details are saved securely. You can continue on WhatsApp afterwards.
      </p>
    </form>
  );
}
