'use client';

import { useActionState } from 'react';
import type { PropertyDetail } from '@/lib/data/properties';
import type { PropertyActionState } from '@/app/(dashboard)/properties/actions';
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '@/lib/types';
import { propertyTypeLabel, statusLabel } from '@/lib/utils';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { ImageUploader } from '@/components/properties/ImageUploader';
import { ExistingImages } from '@/components/properties/ExistingImages';

const initial: PropertyActionState = {};

export function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (prev: PropertyActionState, formData: FormData) => Promise<PropertyActionState>;
  property?: PropertyDetail;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initial);
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main details */}
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
              Property details
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="title" className="label">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  className="input"
                  defaultValue={property?.title ?? ''}
                  placeholder="Modern 3BR Apartment with City Views"
                  required
                />
                {err.title && <p className="field-error">{err.title}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="property_type" className="label">
                    Property type
                  </label>
                  <select
                    id="property_type"
                    name="property_type"
                    className="input"
                    defaultValue={property?.property_type ?? 'apartment'}
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {propertyTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="input"
                    defaultValue={property?.status ?? 'draft'}
                  >
                    {PROPERTY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="label">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  className="input"
                  defaultValue={property?.location ?? ''}
                  placeholder="Downtown, Springfield, IL"
                />
                {err.location && <p className="field-error">{err.location}</p>}
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Description / agent notes
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  className="input resize-y"
                  defaultValue={property?.description ?? ''}
                  placeholder="Highlight standout features, the neighbourhood, recent upgrades…"
                />
                {err.description && <p className="field-error">{err.description}</p>}
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
              Specifications
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="label">
                  Price
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  className="input"
                  defaultValue={property?.price ?? ''}
                  placeholder="450000"
                />
                {err.price && <p className="field-error">{err.price}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bedrooms" className="label">
                    Bedrooms
                  </label>
                  <input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    className="input"
                    defaultValue={property?.bedrooms ?? 0}
                  />
                  {err.bedrooms && <p className="field-error">{err.bedrooms}</p>}
                </div>
                <div>
                  <label htmlFor="bathrooms" className="label">
                    Bathrooms
                  </label>
                  <input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    min="0"
                    className="input"
                    defaultValue={property?.bathrooms ?? 0}
                  />
                  {err.bathrooms && <p className="field-error">{err.bathrooms}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="carpet_area" className="label">
                  Carpet area (sq ft)
                </label>
                <input
                  id="carpet_area"
                  name="carpet_area"
                  type="number"
                  min="0"
                  className="input"
                  defaultValue={property?.carpet_area ?? ''}
                  placeholder="1200"
                />
                {err.carpet_area && <p className="field-error">{err.carpet_area}</p>}
              </div>
              <div>
                <label htmlFor="built_up_area" className="label">
                  Built-up area (sq ft)
                </label>
                <input
                  id="built_up_area"
                  name="built_up_area"
                  type="number"
                  min="0"
                  className="input"
                  defaultValue={property?.built_up_area ?? ''}
                  placeholder="1500"
                />
                {err.built_up_area && <p className="field-error">{err.built_up_area}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="amenities" className="label">
                Amenities
              </label>
              <textarea
                id="amenities"
                name="amenities"
                rows={2}
                className="input resize-y"
                defaultValue={property?.amenities?.join(', ') ?? ''}
                placeholder="Swimming pool, Gym, 24/7 security, Covered parking"
              />
              <p className="mt-1 text-xs text-ink-400">Separate amenities with commas.</p>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-5">
          {property && property.images.length > 0 && (
            <div className="card p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Current photos
              </h2>
              <div className="mt-4">
                <ExistingImages images={property.images} propertyId={property.id} />
              </div>
            </div>
          )}

          <div className="card p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
              {property ? 'Add more photos' : 'Photos'}
            </h2>
            <div className="mt-4">
              <ImageUploader />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
