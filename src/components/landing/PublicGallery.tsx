'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BuildingIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

interface GalleryImage {
  id: string;
  image_url: string;
}

export function PublicGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-ink-100 text-ink-300">
        <BuildingIcon className="h-14 w-14" />
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-ink-100 shadow-card">
        <Image
          src={current.image_url}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition',
                i === active
                  ? 'border-brand-600'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <Image src={img.image_url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
