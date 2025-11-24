import { useState, useEffect } from "react";
import { SimplePool, type Filter } from "nostr-tools";
import type { LanaSystemParameters } from "@/types/nostr";
import { getUserSession } from "@/lib/auth";

export interface ReceivedDonation {
  id: string;
  projectId: string;
  projectTitle: string;
  supporter: string;
  supporterName: string;
  amountLanoshis: string;
  amountFiat: string;
  currency: string;
  fromWallet: string;
  toWallet: string;
  tx: string;
  timestampPaid: number;
  message: string;
}

export const useReceivedDonations = () => {
  const [donations, setDonations] = useState<ReceivedDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceivedDonations = async () => {
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
        setLoading(true);
        setError(null);

        const raw = JSON.parse(systemParamsStr);
        const systemParams: LanaSystemParameters = raw.parameters ?? raw;
        const relays = systemParams.relays;

        if (!relays || relays.length === 0) {
          throw new Error("No relays configured");
        }

        const pool = new SimplePool();
        
        // Fetch all KIND 60200 events (support/donations)
        const filter: Filter = {
          kinds: [60200],
          limit: 500,
        };

        console.log("💰 Fetching received donations for user:", session.nostrHexId);

        const events = await pool.querySync(relays, filter);
        console.log("💰 Total support events found:", events.length);
        pool.close(relays);

        const receivedDonations: ReceivedDonation[] = [];
        const supporterIds = new Set<string>();

        for (const event of events) {
          try {
            const serviceTag = event.tags.find((t) => t[0] === "service")?.[1];
            const projectTag = event.tags.find((t) => t[0] === "project")?.[1];
            const supporter = event.tags.find((t) => t[0] === "p" && t[2] === "supporter")?.[1];
            const projectOwner = event.tags.find((t) => t[0] === "p" && t[2] === "project_owner")?.[1];
            
            // Only include donations where current user is the project owner
            if (serviceTag !== "lanacrowd" || projectOwner !== session.nostrHexId) {
              continue;
            }

            const amountLanoshis = event.tags.find((t) => t[0] === "amount_lanoshis")?.[1];
            const amountFiat = event.tags.find((t) => t[0] === "amount_fiat")?.[1];
            const currencyTag = event.tags.find((t) => t[0] === "currency")?.[1];
            const fromWallet = event.tags.find((t) => t[0] === "from_wallet")?.[1];
            const toWallet = event.tags.find((t) => t[0] === "to_wallet")?.[1];
            const tx = event.tags.find((t) => t[0] === "tx")?.[1];
            const timestampPaid = event.tags.find((t) => t[0] === "timestamp_paid")?.[1];

            if (!projectTag || !supporter || !amountFiat) {
              continue;
            }

            supporterIds.add(supporter);

            receivedDonations.push({
              id: event.id,
              projectId: projectTag.replace("project:", ""),
              projectTitle: "", // Will be filled when we have project data
              supporter: supporter || "",
              supporterName: "", // Will be filled from profile
              amountLanoshis: amountLanoshis || "0",
              amountFiat: amountFiat || "0",
              currency: currencyTag || "EUR",
              fromWallet: fromWallet || "",
              toWallet: toWallet || "",
              tx: tx || "",
              timestampPaid: timestampPaid ? parseInt(timestampPaid) : event.created_at,
              message: event.content || "",
            });
          } catch (err) {
            console.error("Error parsing donation event:", err);
          }
        }

        // Fetch supporter profiles (KIND 0)
        if (supporterIds.size > 0) {
          const pool2 = new SimplePool();
          const profileFilter: Filter = {
            kinds: [0],
            authors: Array.from(supporterIds),
          };

          const profileEvents = await pool2.querySync(relays, profileFilter);
          pool2.close(relays);

          const supporterProfiles = new Map<string, string>();
          for (const profileEvent of profileEvents) {
            try {
              const profile = JSON.parse(profileEvent.content);
              const name = profile.display_name || profile.name || "";
              if (name) {
                supporterProfiles.set(profileEvent.pubkey, name);
              }
            } catch (err) {
              console.error("Error parsing supporter profile:", err);
            }
          }

          // Update supporter names
          receivedDonations.forEach(donation => {
            const name = supporterProfiles.get(donation.supporter);
            if (name) {
              donation.supporterName = name;
            }
          });
        }

        // Sort by timestamp (newest first)
        receivedDonations.sort((a, b) => b.timestampPaid - a.timestampPaid);

        console.log("💰 Received donations:", receivedDonations.length);
        setDonations(receivedDonations);
      } catch (err) {
        console.error("Error fetching received donations:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch donations");
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedDonations();
  }, []);

  return { donations, loading, error };
};
