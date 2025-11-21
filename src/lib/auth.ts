import type { NostrProfile, NostrProfileTags } from "@/types/nostrProfile";

export interface UserSession {
  privateKey: string;
  walletId: string;
  nostrHexId: string;
  nostrNpubId: string;
  privateKeyHex: string;
  profile?: NostrProfile;
  profileTags?: NostrProfileTags;
}

export const saveUserSession = (session: UserSession) => {
  sessionStorage.setItem("lana_user_session", JSON.stringify(session));
};

export const getUserSession = (): UserSession | null => {
  const session = sessionStorage.getItem("lana_user_session");
  return session ? JSON.parse(session) : null;
};

export const clearUserSession = () => {
  sessionStorage.removeItem("lana_user_session");
  sessionStorage.removeItem("lana_system_parameters");
};

export const isAuthenticated = (): boolean => {
  return getUserSession() !== null;
};
