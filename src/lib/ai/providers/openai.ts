import type { Property } from '@/lib/types';
import type { MarketingKit, MarketingProvider } from '@/lib/ai/types';
import { buildPrompt, parseKitJson } from '@/lib/ai/prompt';

export class OpenAIProvider implements MarketingProvider {
  readonly name = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generate(property: Property): Promise<MarketingKit> {
    const { system, user } = buildPrompt(property);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? '';
    const parsed = parseKitJson(content);
    if (!parsed) throw new Error('OpenAI returned an unparseable response.');

    return normaliseKit(parsed);
  }
}

export function normaliseKit(obj: Record<string, unknown>): MarketingKit {
  const get = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string).trim() : '');
  return {
    long_description: get('long_description'),
    short_description: get('short_description'),
    instagram_caption: get('instagram_caption'),
    facebook_post: get('facebook_post'),
    linkedin_post: get('linkedin_post'),
    whatsapp_message: get('whatsapp_message'),
  };
}
