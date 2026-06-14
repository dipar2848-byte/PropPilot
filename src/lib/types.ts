// ============================================================================
// PropPilot — Shared Domain Types
// ============================================================================

export const PROPERTY_TYPES = [
  'apartment',
  'house',
  'villa',
  'townhouse',
  'studio',
  'penthouse',
  'plot',
  'commercial',
  'office',
  'retail',
  'warehouse',
  'other',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = [
  'draft',
  'available',
  'under_offer',
  'sold',
  'rented',
  'archived',
] as const;

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

// NOTE: These four database row types are declared as `type` aliases (not
// interfaces) on purpose. The Supabase/PostgREST client requires each table's
// Row/Insert/Update to satisfy `Record<string, unknown>`, and `interface`
// declarations do not get an implicit index signature, whereas object-literal
// `type` aliases do.
export type Property = {
  id: string;
  user_id: string;
  title: string;
  property_type: PropertyType;
  location: string;
  price: number;
  carpet_area: number | null;
  built_up_area: number | null;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  description: string;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
};

export type PropertyImage = {
  id: string;
  property_id: string;
  user_id: string;
  image_url: string;
  storage_path: string | null;
  position: number;
  is_cover: boolean;
  created_at: string;
};

export type MarketingAsset = {
  id: string;
  property_id: string;
  user_id: string;
  long_description: string;
  short_description: string;
  instagram_caption: string;
  facebook_post: string;
  linkedin_post: string;
  whatsapp_message: string;
  provider: string;
  created_at: string;
  updated_at: string;
};

export type LandingPage = {
  id: string;
  property_id: string;
  user_id: string;
  slug: string;
  public_url: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export const LEAD_STATUSES = ['new', 'contacted', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  phone: string;
  message: string;
  status: LeadStatus;
  source: string;
  created_at: string;
  updated_at: string;
};

export const DOCUMENT_TYPES = [
  'agreement',
  'floor_plan',
  'brochure',
  'legal',
  'identity',
  'other',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_ACCESS_ACTIONS = ['upload', 'preview', 'download', 'delete'] as const;
export type DocumentAccessAction = (typeof DOCUMENT_ACCESS_ACTIONS)[number];

export type PropertyDocument = {
  id: string;
  property_id: string;
  user_id: string;
  file_name: string;
  file_url: string; // storage object path (NOT a public URL)
  document_type: DocumentType;
  file_size: number;
  title: string;
  mime_type: string;
  uploaded_at: string;
  updated_at: string;
};

export type DocumentAccessLog = {
  id: string;
  document_id: string | null;
  property_id: string | null;
  user_id: string;
  action: DocumentAccessAction;
  file_name: string;
  created_at: string;
};

export const COMMISSION_TYPES = ['percentage', 'fixed'] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];

export type PropertyPrivateDetails = {
  id: string;
  property_id: string;
  user_id: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  alternate_contact: string;
  commission_type: CommissionType;
  commission_percentage: number | null;
  commission_amount: number | null;
  expected_commission: number | null;
  deal_stage: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  agency_name: string | null;
  profile_photo_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export interface PropertyWithRelations extends Property {
  property_images: PropertyImage[];
  marketing_assets: MarketingAsset[] | null;
  landing_pages: LandingPage[] | null;
}

// Data shape returned by the get_public_landing RPC.
export interface PublicLandingData {
  property: {
    id: string;
    title: string;
    property_type: PropertyType;
    location: string;
    price: number;
    carpet_area: number | null;
    built_up_area: number | null;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    description: string;
    status: PropertyStatus;
    created_at: string;
  };
  images: Array<{
    id: string;
    image_url: string;
    position: number;
    is_cover: boolean;
  }>;
  marketing: {
    long_description: string;
    short_description: string;
    whatsapp_message: string;
  } | null;
  agent: {
    full_name: string;
    phone: string;
    whatsapp_number: string;
    email: string;
    agency_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

// ----------------------------------------------------------------------------
// Database type map for the Supabase client. Conforms to the shape expected by
// @supabase/supabase-js (Tables include a Relationships array; the schema
// includes Views / Functions / Enums / CompositeTypes).
// ----------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead> & {
          property_id: string;
          user_id: string;
          name: string;
          phone: string;
        };
        Update: Partial<Lead>;
        Relationships: [
          {
            foreignKeyName: 'leads_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      property_documents: {
        Row: PropertyDocument;
        Insert: Partial<PropertyDocument> & {
          property_id: string;
          user_id: string;
          file_name: string;
        };
        Update: Partial<PropertyDocument>;
        Relationships: [
          {
            foreignKeyName: 'property_documents_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      property_private_details: {
        Row: PropertyPrivateDetails;
        Insert: Partial<PropertyPrivateDetails> & {
          property_id: string;
          user_id: string;
        };
        Update: Partial<PropertyPrivateDetails>;
        Relationships: [
          {
            foreignKeyName: 'property_private_details_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: true;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      document_access_log: {
        Row: DocumentAccessLog;
        Insert: Partial<DocumentAccessLog> & {
          user_id: string;
          action: DocumentAccessAction;
        };
        Update: Partial<DocumentAccessLog>;
        Relationships: [];
      };
      properties: {
        Row: Property;
        Insert: Partial<Property> & { user_id: string; title: string };
        Update: Partial<Property>;
        Relationships: [];
      };
      property_images: {
        Row: PropertyImage;
        Insert: Partial<PropertyImage> & {
          property_id: string;
          user_id: string;
          image_url: string;
        };
        Update: Partial<PropertyImage>;
        Relationships: [
          {
            foreignKeyName: 'property_images_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      marketing_assets: {
        Row: MarketingAsset;
        Insert: Partial<MarketingAsset> & {
          property_id: string;
          user_id: string;
        };
        Update: Partial<MarketingAsset>;
        Relationships: [
          {
            foreignKeyName: 'marketing_assets_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: true;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
      landing_pages: {
        Row: LandingPage;
        Insert: Partial<LandingPage> & {
          property_id: string;
          user_id: string;
          slug: string;
        };
        Update: Partial<LandingPage>;
        Relationships: [
          {
            foreignKeyName: 'landing_pages_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: true;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_public_landing: {
        Args: { p_slug: string };
        Returns: PublicLandingData | null;
      };
      submit_public_lead: {
        Args: {
          p_slug: string;
          p_name: string;
          p_phone: string;
          p_message: string;
        };
        Returns: string;
      };
    };
    Enums: {
      property_status: PropertyStatus;
      property_type: PropertyType;
      lead_status: LeadStatus;
      document_type: DocumentType;
      document_access_action: DocumentAccessAction;
      commission_type: CommissionType;
    };
    CompositeTypes: Record<never, never>;
  };
}
