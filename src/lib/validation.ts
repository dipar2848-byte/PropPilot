import { z } from 'zod';
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '@/lib/types';

const numberFromInput = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? v.trim() : v))
  .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))
  .refine((v) => v === null || !Number.isNaN(v), { message: 'Must be a number' });

const requiredNumber = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? v.trim() : v))
  .transform((v) => (v === '' ? 0 : Number(v)))
  .refine((v) => !Number.isNaN(v), { message: 'Must be a number' });

export const propertySchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(160, 'Title is too long'),
  property_type: z.enum(PROPERTY_TYPES),
  location: z.string().trim().max(240, 'Location is too long').default(''),
  price: requiredNumber.refine((v) => v >= 0, 'Price cannot be negative'),
  carpet_area: numberFromInput.refine((v) => v === null || v >= 0, 'Cannot be negative'),
  built_up_area: numberFromInput.refine((v) => v === null || v >= 0, 'Cannot be negative'),
  bedrooms: requiredNumber
    .refine((v) => Number.isInteger(v), 'Must be a whole number')
    .refine((v) => v >= 0 && v <= 100, 'Out of range'),
  bathrooms: requiredNumber
    .refine((v) => Number.isInteger(v), 'Must be a whole number')
    .refine((v) => v >= 0 && v <= 100, 'Out of range'),
  amenities: z.array(z.string().trim().min(1)).max(50).default([]),
  description: z.string().trim().max(8000, 'Description is too long').default(''),
  status: z.enum(PROPERTY_STATUSES).default('draft'),
});

export type PropertyInput = z.infer<typeof propertySchema>;

export const searchSchema = z.object({
  q: z.string().trim().max(160).optional().default(''),
  type: z.string().trim().optional().default(''),
  bedrooms: z.string().trim().optional().default(''),
  minPrice: z.string().trim().optional().default(''),
  maxPrice: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default(''),
});

export const signUpSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().trim().min(1, 'Enter your name').max(120),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/** Parse a comma/newline separated amenities string into a clean array. */
export function parseAmenities(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((a) => a.trim())
        .filter((a) => a.length > 0)
        .map((a) => a.slice(0, 60)),
    ),
  ).slice(0, 50);
}
