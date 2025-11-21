export interface PaymentMethod {
  id: string;
  scope: "collect" | "payout" | "both";
  country: string;
  scheme: string;
  currency: string;
  label: string;
  fields: Record<string, any>;
  verified?: boolean;
  primary?: boolean;
  privacy?: {
    redact_last4?: boolean;
  };
}

export interface NostrProfile {
  // Standard Nostr fields
  name: string;
  display_name: string;
  about: string;
  picture?: string;
  website?: string;
  nip05?: string;
  
  // Payment & Location
  payment_link?: string;
  location: string;
  country: string;
  latitude?: number;
  longitude?: number;
  currency: string;
  
  // LanaCoins specific
  lanoshi2lash: string;
  lanaWalletID?: string;
  whoAreYou: string;
  orgasmic_profile: string;
  
  // Payment methods
  payment_methods?: PaymentMethod[];
  preferred_payout?: string;
  preferred_collect?: string;
  
  // Language (in content, but tag is authoritative)
  language?: string;
}

export interface NostrProfileTags {
  lang: string; // BCP-47 code
  interests: string[]; // "t" tags
  intimacy: string[]; // "o" tags
}
