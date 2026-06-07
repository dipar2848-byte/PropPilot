'use client';

import { useTransition } from 'react';
import Image from 'next/image';
import type { PropertyImage } from '@/lib/types';
import { deleteImageAction, setCoverImageAction } from '@/app/(dashboard)/properties/actions';
import { TrashIcon, CheckIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

export function ExistingImages({
  images,
  propertyId,
}: {
  images: PropertyImage[];
  propertyId: string;
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDelete(id: string) {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    startTransition(async () => {
      try {
        await deleteImageAction(id, propertyId);
        toast('Image deleted', 'success');
      } catch {
        toast('Could not delete image', 'error');
      }
    });
  }

  function handleCover(id: string) {
    startTransition(async () => {
      try {
        await setCoverImageAction(id, propertyId);
        toast('Cover image updated', 'success');
      } catch {
        toast('Could not set cover image', 'error');
      }
    });
  }

  return (
    <div className="grid grid-cols-3 gap-3" aria-busy={pending}>
      {images.map((img) => (
        <div
          key={img.id}
          className="group relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-ink-100"
        >
          <Image src={img.image_url} alt="Property" fill sizes="120px" className="object-cover" />
          {img.is_cover && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Cover
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-ink-900/80 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
            {!img.is_cover && (
              <button
                type="button"
                onClick={() => handleCover(img.id)}
                disabled={pending}
                className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink-700 hover:bg-white"
                title="Set as cover"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(img.id)}
              disabled={pending}
              className="ml-auto grid h-7 w-7 place-items-center rounded-md bg-white/90 text-rose-600 hover:bg-white"
              title="Delete image"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
