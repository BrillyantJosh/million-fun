export interface LanaSystemParameters {
  relays: string[];
  electrum: { host: string; port: string }[];
  fx: {
    EUR: number;
    USD: number;
    GBP: number;
  };
  split: string;
  version: string;
  valid_from: string;
  trusted_signers: {
    Lana8Wonder: string[];
    LanaRegistrar: string[];
    LanaRooms: string[];
    LanaAlignment: string[];
    LanaPaysUs: string[];
    "100MillionFun": string[];
    LanaKnights: string[];
    LanaHelpsUs: string[];
    LanaSelfResponsibility: string[];
  };
}

export interface RelayStatus {
  url: string;
  connected: boolean;
  latency?: number;
}
