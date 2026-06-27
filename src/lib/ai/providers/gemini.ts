import type { Property } from '@/lib/types';
import { DEFAULT_KIT_OPTIONS, type KitOptions, type MarketingKit, type MarketingProvider } from '@/lib/ai/types';
import { buildPrompt, parseKitJson } from '@/lib/ai/prompt';
import { normaliseKit } from '@/lib/ai/providers/openai';

export class GeminiProvider implements MarketingProvider {
  readonly name = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generate(property: Property, options: KitOptions = DEFAULT_KIT_OPTIONS): Promise<MarketingKit> {
    const { system, user } = buildPrompt(property, options);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model,
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('\n');
    const parsed = parseKitJson(text);
    if (!parsed) throw new Error('Gemini returned an unparseable response.');

    return normaliseKit(parsed);
  }
}
