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
        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const relays = systemParams.relays;

        console.log('✅ System params loaded:', { hasRelays: !!relays, relayCount: relays?.length });
        console.log('🔍 Fetching wallets from relays:', relays);
        console.log('🔍 Looking for customer pubkey:', session.nostrHexId);

        if (!relays || relays.length === 0) {
          setError("No relays configured");
          setLoading(false);
          return;
        }

        const pool = new SimplePool();
        
        try {
          // Fetch KIND 30889 events with timeout per relay
          const eventPromises = relays.map(async (relay) => {
            console.log(`🔄 Querying ${relay} for KIND 30889...`);
            
            return new Promise<any[]>((resolve) => {
              const timeout = setTimeout(() => {
                console.warn(`⏱️ ${relay}: Timeout (5s)`);
                resolve([]);
              }, 5000);

              try {
                pool.querySync([relay], {
                  kinds: [30889],
                  "#d": [session.nostrHexId],
                  limit: 10
                }).then((events) => {
                  clearTimeout(timeout);
                  console.log(`✅ ${relay}: Found ${events.length} events`);
                  if (events.length > 0) {
                    console.log(`📋 ${relay} event:`, events[0]);
                  }
                  resolve(events);
                }).catch((error) => {
                  clearTimeout(timeout);
                  console.error(`❌ ${relay}: ${error.message}`);
                  resolve([]);
                });
              } catch (error) {
                clearTimeout(timeout);
                console.error(`❌ ${relay}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                resolve([]);
              }
            });
          });

          const allResults = await Promise.all(eventPromises);
          const allEvents = allResults.flat();
          
          console.log('📊 Total events found:', allEvents.length);

          if (allEvents.length === 0) {
            console.warn('⚠️ No wallet events found for user');
            setWallets([]);
            setLoading(false);
            return;
          }

          // Get the most recent event (highest created_at)
          const sortedEvents = allEvents.sort((a, b) => b.created_at - a.created_at);
          const event = sortedEvents[0];
          
          console.log('📄 Using event from:', event.pubkey);
          console.log('📄 Event tags:', event.tags);
          
          const walletTags = event.tags.filter(tag => tag[0] === "w");
          console.log('💰 Found wallet tags:', walletTags.length);
          
          const parsedWallets: UserWallet[] = walletTags.map(tag => ({
            walletId: tag[1] || "",
            walletType: tag[2] || "Unknown",
            chain: tag[3] || "LANA",
            note: tag[4] || "",
            unregisteredLanoshi: tag[5] || "0"
          }));

          console.log('💰 Parsed wallets:', parsedWallets);
          setWallets(parsedWallets);
          setLoading(false);
        } finally {
          pool.close(relays);
        }
      } catch (err) {
        console.error('❌ Error fetching wallets:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch wallets");
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  return { wallets, loading, error };
};
