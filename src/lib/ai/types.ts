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

export interface MarketingProvider {
  readonly name: string;
  generate(property: Property): Promise<MarketingKit>;
}
