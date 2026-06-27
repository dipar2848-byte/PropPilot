import type { Property } from '@/lib/types';
import { DEFAULT_KIT_OPTIONS, type KitOptions, type MarketingKit, type MarketingProvider } from '@/lib/ai/types';
import { buildPrompt, parseKitJson } from '@/lib/ai/prompt';
import { normaliseKit } from '@/lib/ai/providers/openai';

export class AnthropicProvider implements MarketingProvider {
  readonly name = 'anthropic';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generate(property: Property, options: KitOptions = DEFAULT_KIT_OPTIONS): Promise<MarketingKit> {
    const { system, user } = buildPrompt(property, options);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1500,
        temperature: 0.8,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Anthropic request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (data.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('\n');
    const parsed = parseKitJson(text);
    if (!parsed) throw new Error('Anthropic returned an unparseable response.');

    return normaliseKit(parsed);
  }
}
