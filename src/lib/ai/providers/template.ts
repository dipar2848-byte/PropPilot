import type { Property } from '@/lib/types';
import {
  DEFAULT_KIT_OPTIONS,
  type KitOptions,
  type KitTone,
  type MarketingKit,
  type MarketingProvider,
} from '@/lib/ai/types';
import { propertyTypeLabel, formatPrice, formatArea } from '@/lib/utils';

/** Tone-specific opening flourish for the template engine (English only). */
function toneOpener(tone: KitTone, title: string, typeLabel: string, loc: string): string {
  switch (tone) {
    case 'luxury':
      return `Presenting ${title} — an exceptional ${typeLabel.toLowerCase()}${loc} where refined design meets an elevated lifestyle.`;
    case 'friendly':
      return `Say hello to ${title}${loc} — a lovely ${typeLabel.toLowerCase()} that's ready to welcome you home.`;
    case 'concise':
      return `${title}${loc}: a well-appointed ${typeLabel.toLowerCase()} offering great value.`;
    case 'enthusiastic':
      return `You'll love ${title}${loc} — a standout ${typeLabel.toLowerCase()} packed with everything you've been looking for!`;
    case 'professional':
    default:
      return `Welcome to ${title} — a remarkable ${typeLabel.toLowerCase()}${loc} that blends comfort, style and everyday convenience.`;
  }
}

function highlights(property: Property): string[] {
  const out: string[] = [];
  if (property.bedrooms > 0) {
    out.push(`${property.bedrooms} spacious bedroom${property.bedrooms > 1 ? 's' : ''}`);
  }
  if (property.bathrooms > 0) {
    out.push(`${property.bathrooms} well-appointed bathroom${property.bathrooms > 1 ? 's' : ''}`);
  }
  if (property.built_up_area) out.push(`${formatArea(property.built_up_area)} of built-up space`);
  else if (property.carpet_area) out.push(`${formatArea(property.carpet_area)} of carpet area`);
  property.amenities.slice(0, 4).forEach((a) => out.push(a.toLowerCase()));
  return out;
}

function locationPhrase(property: Property): string {
  return property.location ? ` in ${property.location}` : '';
}

/**
 * Deterministic, high-quality copy generator. Works with zero configuration so
 * PropPilot is fully functional out of the box. Acts as the fallback whenever a
 * real LLM provider is not configured or fails.
 */
export class TemplateProvider implements MarketingProvider {
  readonly name = 'template';

  async generate(
    property: Property,
    options: KitOptions = DEFAULT_KIT_OPTIONS,
  ): Promise<MarketingKit> {
    const typeLabel = propertyTypeLabel(property.property_type);
    const loc = locationPhrase(property);
    const price = property.price > 0 ? formatPrice(property.price) : null;
    const hl = highlights(property);
    const hlSentence =
      hl.length > 0
        ? `${hl.slice(0, -1).join(', ')}${hl.length > 1 ? ' and ' : ''}${hl[hl.length - 1]}`
        : 'thoughtfully designed living spaces';

    const amenityLine =
      property.amenities.length > 0
        ? ` Residents enjoy ${property.amenities.slice(0, 6).join(', ')}.`
        : '';

    const agentNotes = property.description ? ` ${property.description.trim()}` : '';

    const long_description = [
      toneOpener(options.tone, property.title, typeLabel, loc),
      `Step inside to discover ${hlSentence}, all crafted to elevate the way you live.`,
      amenityLine,
      agentNotes,
      price
        ? `Offered at ${price}, this is an opportunity that rarely comes to market.`
        : `Priced to impress, this is an opportunity that rarely comes to market.`,
      `Whether you are buying your forever home or expanding your investment portfolio, this property delivers exceptional value. Arrange a private viewing today and experience it for yourself.`,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const short_description = [
      `${typeLabel}${loc}`,
      property.bedrooms ? `${property.bedrooms} BR` : null,
      property.bathrooms ? `${property.bathrooms} BA` : null,
      price ? `· ${price}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const hashtags = [
      '#realestate',
      `#${property.property_type}`,
      property.location
        ? `#${property.location.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'property'}`
        : '#property',
      '#forsale',
      '#dreamhome',
    ].join(' ');

    const instagram_caption = [
      `✨ ${property.title}${loc} ✨`,
      `${property.bedrooms ? `${property.bedrooms} bed` : ''}${
        property.bathrooms ? ` · ${property.bathrooms} bath` : ''
      }${price ? ` · ${price}` : ''}`.trim(),
      property.amenities.length ? `Featuring ${property.amenities.slice(0, 3).join(', ')}.` : '',
      'DM us to book a viewing 📲',
      hashtags,
    ]
      .filter(Boolean)
      .join('\n');

    const facebook_post = [
      `🏡 NEW LISTING: ${property.title}${loc}`,
      '',
      `${short_description}`,
      property.amenities.length
        ? `Highlights: ${property.amenities.slice(0, 6).join(', ')}.`
        : '',
      '',
      'This one will move fast. Send us a message or comment below to schedule your private tour today!',
    ]
      .filter((l) => l !== undefined)
      .join('\n')
      .trim();

    const linkedin_post = [
      `New to market: ${property.title}${loc}.`,
      '',
      `A ${typeLabel.toLowerCase()} offering ${hlSentence}${price ? `, available at ${price}` : ''}.`,
      property.amenities.length
        ? `Key amenities include ${property.amenities.slice(0, 5).join(', ')}.`
        : '',
      '',
      'An excellent opportunity for owner-occupiers and investors alike. Connect with me to discuss availability, financials and viewing options.',
    ]
      .filter(Boolean)
      .join('\n')
      .trim();

    const whatsapp_message = [
      `Hi! 👋 I'd love to tell you about *${property.title}*${loc}.`,
      `${short_description}.`,
      property.amenities.length ? `It features ${property.amenities.slice(0, 4).join(', ')}.` : '',
      'Would you be free this week for a quick viewing? 😊',
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      long_description,
      short_description,
      instagram_caption,
      facebook_post,
      linkedin_post,
      whatsapp_message,
    };
  }
}
