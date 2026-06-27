import type { Property } from '@/lib/types';
import {
  DEFAULT_KIT_OPTIONS,
  normaliseKitOptions,
  type KitOptions,
  type MarketingKitResult,
  type MarketingProvider,
} from '@/lib/ai/types';
import { getAiConfig } from '@/lib/env';
import { TemplateProvider } from '@/lib/ai/providers/template';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { AnthropicProvider } from '@/lib/ai/providers/anthropic';
import { GeminiProvider } from '@/lib/ai/providers/gemini';

/**
 * Resolves the configured AI provider. Returns null when the requested
 * provider is missing its API key so the caller can gracefully fall back to
 * the deterministic template engine.
 */
function resolveProvider(): MarketingProvider | null {
  const cfg = getAiConfig();
  switch (cfg.provider) {
    case 'openai':
      return cfg.openaiApiKey
        ? new OpenAIProvider(cfg.openaiApiKey, cfg.openaiModel)
        : null;
    case 'anthropic':
      return cfg.anthropicApiKey
        ? new AnthropicProvider(cfg.anthropicApiKey, cfg.anthropicModel)
        : null;
    case 'gemini':
      return cfg.geminiApiKey
        ? new GeminiProvider(cfg.geminiApiKey, cfg.geminiModel)
        : null;
    case 'template':
    default:
      return null;
  }
}

const templateProvider = new TemplateProvider();

/**
 * Generates a full marketing kit for a property. Always succeeds: if the
 * configured LLM provider is unavailable or errors, it transparently falls
 * back to the high-quality template engine.
 *
 * `options` (tone + language, Phase 8) steer the copy. The deterministic
 * template engine is English-only, so a non-English request without a working
 * LLM provider degrades to English template copy (and reports `template`).
 */
export async function generateMarketingKit(
  property: Property,
  optionsInput?: Partial<KitOptions> | null,
): Promise<MarketingKitResult> {
  const options = optionsInput ? normaliseKitOptions(optionsInput) : DEFAULT_KIT_OPTIONS;
  const provider = resolveProvider();

  if (provider) {
    try {
      const kit = await provider.generate(property, options);
      // Guard against an LLM returning empty fields — backfill from template.
      const fallback = await templateProvider.generate(property, options);
      return {
        long_description: kit.long_description || fallback.long_description,
        short_description: kit.short_description || fallback.short_description,
        instagram_caption: kit.instagram_caption || fallback.instagram_caption,
        facebook_post: kit.facebook_post || fallback.facebook_post,
        linkedin_post: kit.linkedin_post || fallback.linkedin_post,
        whatsapp_message: kit.whatsapp_message || fallback.whatsapp_message,
        provider: provider.name,
      };
    } catch (err) {
      console.error(`[ai] provider "${provider.name}" failed, using template:`, err);
    }
  }

  const kit = await templateProvider.generate(property, options);
  return { ...kit, provider: templateProvider.name };
}
