'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitPublicLeadAction, type PublicLeadState } from '@/app/leads/actions';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { WhatsAppIcon } from '@/components/ui/Icons';

const initial: PublicLeadState = {};

export function LeadForm({
  slug,
  whatsappNumber,
  whatsappMessage,
  disabled = false,
}: {
  slug: string;
  whatsappNumber: string;
  whatsappMessage: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(submitPublicLeadAction, initial);
  const handedOff = useRef(false);

  // MANDATORY FLOW: only after the lead is saved (ok === true) do we hand off
  // to WhatsApp. The lead is always persisted first, server-side.
  useEffect(() => {
    if (state.ok && !handedOff.current) {
      handedOff.current = true;
      if (whatsappNumber) {
        const digits = whatsappNumber.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${digits}?text=${encodeURIComponent(whatsappMessage)}`;
        // Open in a new tab so the confirmation remains visible.
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }, [state.ok, whatsappNumber, whatsappMessage]);

  if (disabled) {
    return (
      <div className="rounded-xl bg-ink-50 p-4 text-center text-sm text-ink-500">
        This property is no longer available for inquiries.
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-sm font-semibold text-emerald-800">Thanks — your inquiry was sent!</p>
        <p className="mt-1 text-xs text-emerald-700">
          The agent has your details and will be in touch shortly.
        </p>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              whatsappMessage,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-3 inline-flex bg-[#25D366] px-4 py-2 text-sm text-white hover:bg-[#1ebe5d]"
          >
            <WhatsAppIcon className="h-4 w-4" /> Continue on WhatsApp
          </a>
        )}
      </div>
    );
  }

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
        {whatsappNumber ? 'Send inquiry & open WhatsApp' : 'Send inquiry'}
      </SubmitButton>
      <p className="text-center text-[11px] text-ink-400">
        Your details are saved securely before you continue.
      </p>
    </form>
  );
}
