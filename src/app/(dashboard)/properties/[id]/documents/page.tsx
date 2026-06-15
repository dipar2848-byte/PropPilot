import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import {
  listPropertyDocuments,
  listDocumentAccessLog,
  MAX_DOCUMENTS_PER_PROPERTY,
} from '@/lib/data/documents';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { DocumentList } from '@/components/documents/DocumentList';
import { AccessLogList } from '@/components/documents/AccessLogList';
import { LockIcon } from '@/components/ui/Icons';

export const metadata: Metadata = { title: 'Documents' };
export const dynamic = 'force-dynamic';

export default async function PropertyDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const [documents, accessLog] = await Promise.all([
    listPropertyDocuments(id),
    listDocumentAccessLog(id),
  ]);

  const remaining = Math.max(0, MAX_DOCUMENTS_PER_PROPERTY - documents.length);
  const atLimit = documents.length >= MAX_DOCUMENTS_PER_PROPERTY;

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={property.title}
        backHref={`/properties/${id}`}
        backLabel="Back to property"
      />

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
        <p>
          Documents are <span className="font-semibold">private to you</span>. They are stored in a
          non-public bucket and only ever opened through short-lived secure links — never exposed on
          your public landing page.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
              {documents.length} of {MAX_DOCUMENTS_PER_PROPERTY} documents
            </h2>
            <DocumentList documents={documents} propertyId={id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Upload a document</h2>
            <DocumentUploadForm propertyId={id} atLimit={atLimit} remaining={remaining} />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Activity</h2>
            <AccessLogList entries={accessLog} />
          </div>
        </div>
      </div>
    </div>
  );
}
