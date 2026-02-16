import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: string;
  financing_inspirations: number;
  enhancing_current_system: number;
  nostr_key: string | null;
  nostr_hex_id: string | null;
  disable_new_projects: boolean;
  created_at: string;
  updated_at: string;
}

export const useAppSettings = () => {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AppSettings | null;
    },
  });
};
