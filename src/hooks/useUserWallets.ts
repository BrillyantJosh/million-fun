import { useEffect, useState } from "react";
import { SimplePool } from "nostr-tools/pool";
import { getUserSession } from "@/lib/auth";
import type { LanaSystemParameters } from "@/types/nostr";

export interface UserWallet {
  walletId: string;
  walletType: string;
  note: string;
  chain: string;
  unregisteredLanoshi: string;
}

export const useUserWallets = () => {
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      const session = getUserSession();
      if (!session) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const systemParamsStr = sessionStorage.getItem("lana_system_parameters");
      if (!systemParamsStr) {
        setError("System parameters not found");
        setLoading(false);
        return;
      }

      try {
        const systemParams: LanaSystemParameters = JSON.parse(systemParamsStr);
        const relays = systemParams.relays;

        if (!relays || relays.length === 0) {
          setError("No relays configured");
          setLoading(false);
          return;
        }

        const pool = new SimplePool();
        
        try {
          // Fetch KIND 30889 events for current user
          const events = await pool.querySync(relays, {
            kinds: [30889],
            "#d": [session.nostrHexId],
            limit: 1
          });

          if (events.length === 0) {
            setWallets([]);
            setLoading(false);
            return;
          }

          // Parse wallet tags from the most recent event
          const event = events[0];
          const walletTags = event.tags.filter(tag => tag[0] === "w");
          
          const parsedWallets: UserWallet[] = walletTags.map(tag => ({
            walletId: tag[1] || "",
            walletType: tag[2] || "Unknown",
            chain: tag[3] || "LANA",
            note: tag[4] || "",
            unregisteredLanoshi: tag[5] || "0"
          }));

          setWallets(parsedWallets);
          setLoading(false);
        } finally {
          pool.close(relays);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch wallets");
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  return { wallets, loading, error };
};
