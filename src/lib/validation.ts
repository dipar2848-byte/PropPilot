import { z } from 'zod';
import { PROPERTY_TYPES, PROPERTY_STATUSES, DOCUMENT_TYPES, COMMISSION_TYPES } from '@/lib/types';

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

// ----------------------------------------------------------------------------
// Agent profile
// ----------------------------------------------------------------------------
const phoneField = z
  .string()
  .trim()
  .max(20, 'Too long')
  .refine(
    (v) => v === '' || /^[+]?[0-9\s-]{6,20}$/.test(v),
    'Enter a valid phone number',
  )
  .default('');

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter your name').max(120, 'Too long'),
  phone: phoneField,
  whatsapp_number: phoneField,
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Enter a valid email')
    .default(''),
  agency_name: z.string().trim().max(160, 'Too long').optional().default(''),
  profile_photo_url: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || /^https?:\/\//.test(v), 'Must be a valid URL')
    .optional()
    .default(''),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// ----------------------------------------------------------------------------
// Leads
// ----------------------------------------------------------------------------
export const publicLeadSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1, 'Enter your name').max(120, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .min(6, 'Enter a valid phone number')
    .max(20, 'Phone number is too long')
    .refine((v) => /^[+]?[0-9\s-]{6,20}$/.test(v), 'Enter a valid phone number'),
  message: z.string().trim().max(2000, 'Message is too long').optional().default(''),
  // Honeypot — must remain empty. Bots tend to fill every field.
  company: z.string().max(0).optional().default(''),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

export const leadStatusSchema = z.object({
  leadId: z.string().uuid('Invalid lead'),
  status: z.enum(['new', 'contacted', 'closed']),
});

export const documentUploadSchema = z.object({
  propertyId: z.string().uuid('Invalid property'),
  title: z.string().trim().max(160, 'Title is too long').optional().default(''),
  document_type: z.enum(DOCUMENT_TYPES).default('other'),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

const optionalMoney = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? v.trim() : v))
  .transform((v) => (v === '' || v === null || v === undefined ? null : Number(v)))
  .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), { message: 'Must be a non-negative number' });

export const privateDetailsSchema = z.object({
  propertyId: z.string().uuid('Invalid property'),
  owner_name: z.string().trim().max(160, 'Too long').optional().default(''),
  owner_phone: z.string().trim().max(20, 'Too long').optional().default(''),
  owner_email: z
    .string()
    .trim()
    .max(160, 'Too long')
    .optional()
    .default('')
    .refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Enter a valid email'),
  alternate_contact: z.string().trim().max(160, 'Too long').optional().default(''),
  commission_type: z.enum(COMMISSION_TYPES).default('percentage'),
  commission_percentage: optionalMoney,
  commission_amount: optionalMoney,
  expected_commission: optionalMoney,
  deal_stage: z.string().trim().max(80, 'Too long').optional().default(''),
  internal_notes: z.string().trim().max(8000, 'Notes are too long').optional().default(''),
});

export type PrivateDetailsInput = z.infer<typeof privateDetailsSchema>;

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
