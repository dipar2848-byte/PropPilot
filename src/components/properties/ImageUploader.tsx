'use client';

import { useRef, useState, useEffect } from 'react';
import { PlusIcon, XIcon, BuildingIcon } from '@/components/ui/Icons';

interface PreviewFile {
  id: string;
  file: File;
  url: string;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Client-side multi-image picker. Selected files are appended to the enclosing
 * <form> via a hidden DataTransfer-backed file input so they upload with the
 * server action. Provides live previews and validation.
 */
export function ImageUploader({ name = 'images' }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Keep the hidden input's FileList in sync with our state.
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f.file));
    inputRef.current.files = dt.files;
  }, [files]);

  useEffect(() => {
    return () => files.forEach((f) => URL.revokeObjectURL(f.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next: PreviewFile[] = [];
    for (const file of Array.from(list)) {
      if (!ALLOWED.includes(file.type)) {
        setError(`"${file.name}" is not a supported image type.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" exceeds the 5MB limit.`);
        continue;
      }
      next.push({ id: `${file.name}-${file.size}-${Math.random()}`, file, url: URL.createObjectURL(file) });
    }
    setFiles((prev) => [...prev, ...next].slice(0, 20));
  }

  function remove(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={ALLOWED.join(',')}
        multiple
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files);
        }}
        tabIndex={-1}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 p-6 text-center"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white text-ink-400 shadow-card">
          <BuildingIcon className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium text-ink-700">Add property photos</p>
        <p className="mt-1 text-xs text-ink-400">
          PNG, JPG, WEBP or GIF up to 5MB each. Drag &amp; drop or browse.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-secondary mt-4"
        >
          <PlusIcon className="h-4 w-4" /> Browse images
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((f, i) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.file.name} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-900/70 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
