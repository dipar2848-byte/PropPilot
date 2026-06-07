// ============================================================================
// PropPilot — Environment Variable Access (typed + validated)
// ============================================================================
// Centralises access to environment variables so that missing configuration
// fails loudly and early with a clear message instead of obscure runtime errors.
// ============================================================================

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to your .env.local (local) or Vercel Project Settings (production).`,
    );
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  contactWhatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '',
};

/** Validated public env, used on the server where we want hard guarantees. */
export function getPublicEnv() {
  return {
    supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL', publicEnv.supabaseUrl),
    supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', publicEnv.supabaseAnonKey),
    siteUrl: publicEnv.siteUrl,
  };
}

export function getServiceRoleKey() {
  return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export type AiProvider = 'template' | 'openai' | 'anthropic' | 'gemini';

export function getAiConfig() {
  const provider = (process.env.AI_PROVIDER ?? 'template').toLowerCase() as AiProvider;
  return {
    provider,
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
  };
}
