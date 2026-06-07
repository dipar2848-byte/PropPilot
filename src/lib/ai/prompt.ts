import type { Property } from '@/lib/types';
import { propertyTypeLabel, formatPrice, formatArea } from '@/lib/utils';

/** Builds a structured fact sheet shared across all AI providers. */
export function buildPropertyFacts(property: Property): string {
  const lines: string[] = [];
  lines.push(`Title: ${property.title}`);
  lines.push(`Type: ${propertyTypeLabel(property.property_type)}`);
  if (property.location) lines.push(`Location: ${property.location}`);
  if (property.price > 0) lines.push(`Price: ${formatPrice(property.price)}`);
  lines.push(`Bedrooms: ${property.bedrooms}`);
  lines.push(`Bathrooms: ${property.bathrooms}`);
  if (property.carpet_area) lines.push(`Carpet area: ${formatArea(property.carpet_area)}`);
  if (property.built_up_area) lines.push(`Built-up area: ${formatArea(property.built_up_area)}`);
  if (property.amenities.length) lines.push(`Amenities: ${property.amenities.join(', ')}`);
  if (property.description) lines.push(`Notes from agent: ${property.description}`);
  return lines.join('\n');
}

/** The instruction prompt used by LLM providers. Returns strict JSON. */
export function buildPrompt(property: Property): { system: string; user: string } {
  const facts = buildPropertyFacts(property);

  const system = [
    'You are an expert real estate copywriter producing a marketing kit for a property listing.',
    'Write persuasive, accurate, professional copy. Never invent facts not present in the brief.',
    'Return ONLY valid minified JSON with exactly these string keys:',
    '"long_description", "short_description", "instagram_caption", "facebook_post", "linkedin_post", "whatsapp_message".',
    'Guidelines:',
    '- long_description: 150-250 words, vivid and benefit-led.',
    '- short_description: 1-2 sentences (max 280 chars).',
    '- instagram_caption: punchy, 3-6 relevant hashtags, 1-2 tasteful emojis.',
    '- facebook_post: friendly, community-oriented, a clear call to action.',
    '- linkedin_post: professional tone aimed at investors/professionals.',
    '- whatsapp_message: concise, personable, ends inviting a viewing.',
  ].join('\n');

  const user = `Create the marketing kit for this property:\n\n${facts}`;

  return { system, user };
}

/** Tries to extract a MarketingKit-shaped object from raw LLM text. */
export function parseKitJson(text: string): Record<string, string> | null {
  if (!text) return null;
  // Strip code fences if present.
  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (obj && typeof obj === 'object') return obj as Record<string, string>;
    return null;
  } catch {
    return null;
  }
}
