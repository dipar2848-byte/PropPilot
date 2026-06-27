import type { Property } from '@/lib/types';

export interface MarketingKit {
  long_description: string;
  short_description: string;
  instagram_caption: string;
  facebook_post: string;
  linkedin_post: string;
  whatsapp_message: string;
}

export interface MarketingKitResult extends MarketingKit {
  provider: string;
}

// ----------------------------------------------------------------------------
// AI Kit generation options (Phase 8)
// ----------------------------------------------------------------------------
// Tone + language are generation-time inputs only — they steer the copy but are
// NOT persisted (no schema change). The full catalogue lives in code so it can
// evolve without a migration.

export const KIT_TONES = [
  'professional',
  'luxury',
  'friendly',
  'concise',
  'enthusiastic',
] as const;
export type KitTone = (typeof KIT_TONES)[number];

export const KIT_LANGUAGES = [
  'english',
  'hindi',
  'marathi',
  'tamil',
  'telugu',
  'bengali',
  'gujarati',
  'kannada',
] as const;
export type KitLanguage = (typeof KIT_LANGUAGES)[number];

export interface KitOptions {
  tone: KitTone;
  language: KitLanguage;
}

export const DEFAULT_KIT_OPTIONS: KitOptions = {
  tone: 'professional',
  language: 'english',
};

/** Human-friendly labels for the UI selectors. */
export const TONE_LABELS: Record<KitTone, string> = {
  professional: 'Professional',
  luxury: 'Luxury',
  friendly: 'Friendly',
  concise: 'Concise',
  enthusiastic: 'Enthusiastic',
};

export const LANGUAGE_LABELS: Record<KitLanguage, string> = {
  english: 'English',
  hindi: 'Hindi (हिन्दी)',
  marathi: 'Marathi (मराठी)',
  tamil: 'Tamil (தமிழ்)',
  telugu: 'Telugu (తెలుగు)',
  bengali: 'Bengali (বাংলা)',
  gujarati: 'Gujarati (ગુજરાતી)',
  kannada: 'Kannada (ಕನ್ನಡ)',
};

/** Short style guidance injected into the LLM prompt for each tone. */
export const TONE_GUIDANCE: Record<KitTone, string> = {
  professional: 'polished, credible and benefit-led — suitable for serious buyers.',
  luxury: 'aspirational and elegant, emphasising exclusivity, finishes and lifestyle.',
  friendly: 'warm, conversational and approachable, like a trusted local agent.',
  concise: 'tight and scannable — short sentences, no filler, lead with the key facts.',
  enthusiastic: 'energetic and upbeat with tasteful excitement, without overhyping.',
};

export function normaliseKitOptions(input?: Partial<KitOptions> | null): KitOptions {
  const tone = (input?.tone && (KIT_TONES as readonly string[]).includes(input.tone)
    ? input.tone
    : DEFAULT_KIT_OPTIONS.tone) as KitTone;
  const language = (input?.language && (KIT_LANGUAGES as readonly string[]).includes(input.language)
    ? input.language
    : DEFAULT_KIT_OPTIONS.language) as KitLanguage;
  return { tone, language };
}

export interface MarketingProvider {
  readonly name: string;
  generate(property: Property, options?: KitOptions): Promise<MarketingKit>;
}
