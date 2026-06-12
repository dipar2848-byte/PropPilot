'use client';

import { useActionState, useState } from 'react';
import {
  updateLeadStatusAction,
  type LeadActionState,
} from '@/app/leads/actions';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { PhoneIcon, WhatsAppIcon, CheckIcon } from '@/components/ui/Icons';
import { relativeTime, truncate, whatsappLink } from '@/lib/utils';
import type { Lead } from '@/lib/types';

const initial: LeadActionState = {};

function StatusButton({
  leadId,
  status,
  label,
  icon,
  disabled,
}: {
  leadId: string;
  status: 'contacted' | 'closed';
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const [, formAction, pending] = useActionState(updateLeadStatusAction, initial);
  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="btn-secondary flex-1 justify-center text-xs disabled:opacity-50"
      >
        {icon}
        {pending ? 'Saving…' : label}
      </button>
    </form>
  );
}

export function LeadCard({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const waMessage = `Hi ${lead.name}, thanks for your interest. How can I help?`;

  return (
    <div className="card p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-ink-900">{lead.name}</p>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="mt-0.5 text-sm text-ink-500">{lead.phone}</p>
          {lead.message && (
            <p className="mt-1 text-sm text-ink-600">
              {expanded ? lead.message : truncate(lead.message, 80)}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-ink-400">{relativeTime(lead.created_at)}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${lead.phone}`} className="btn-primary flex-1 justify-center text-xs">
              <PhoneIcon className="h-4 w-4" /> Call
            </a>
            <a
              href={whatsappLink(lead.phone, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn flex-1 justify-center bg-[#25D366] text-xs text-white hover:bg-[#1ebe5d]"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusButton
              leadId={lead.id}
              status="contacted"
              label="Mark contacted"
              disabled={lead.status === 'contacted'}
            />
            <StatusButton
              leadId={lead.id}
              status="closed"
              label="Mark closed"
              icon={<CheckIcon className="h-4 w-4" />}
              disabled={lead.status === 'closed'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
