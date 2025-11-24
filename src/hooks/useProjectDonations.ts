import { useState, useEffect } from "react";
import { SimplePool, type Filter } from "nostr-tools";
import type { LanaSystemParameters } from "@/types/nostr";

export interface ProjectDonation {
  id: string;
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

export const useProjectDonations = (projectId: string | undefined) => {
  const [donations, setDonations] = useState<ProjectDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchProjectDonations = async () => {
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
        
        const filter: Filter = {
          kinds: [60200],
          "#project": [`project:${projectId}`],
          limit: 500,
        };

        console.log("💰 Fetching donations for project:", projectId);

        const events = await pool.querySync(relays, filter);
        console.log("💰 Total donation events found:", events.length);
        pool.close(relays);

        const projectDonations: ProjectDonation[] = [];
        const supporterIds = new Set<string>();

        for (const event of events) {
          try {
            const serviceTag = event.tags.find((t) => t[0] === "service")?.[1];
            const supporter = event.tags.find((t) => t[0] === "p" && t[2] === "supporter")?.[1];
            
            if (serviceTag !== "lanacrowd") {
              continue;
            }

            const amountLanoshis = event.tags.find((t) => t[0] === "amount_lanoshis")?.[1];
            const amountFiat = event.tags.find((t) => t[0] === "amount_fiat")?.[1];
            const currencyTag = event.tags.find((t) => t[0] === "currency")?.[1];
            const fromWallet = event.tags.find((t) => t[0] === "from_wallet")?.[1];
            const toWallet = event.tags.find((t) => t[0] === "to_wallet")?.[1];
            const tx = event.tags.find((t) => t[0] === "tx")?.[1];
            const timestampPaid = event.tags.find((t) => t[0] === "timestamp_paid")?.[1];

            if (!supporter || !amountFiat) {
              continue;
            }

            supporterIds.add(supporter);

            projectDonations.push({
              id: event.id,
              supporter: supporter || "",
              supporterName: "",
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

        // Fetch supporter profiles
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

          projectDonations.forEach(donation => {
            const name = supporterProfiles.get(donation.supporter);
            if (name) {
              donation.supporterName = name;
            }
          });
        }

        projectDonations.sort((a, b) => b.timestampPaid - a.timestampPaid);

        console.log("💰 Project donations:", projectDonations.length);
        setDonations(projectDonations);
      } catch (err) {
        console.error("Error fetching project donations:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch donations");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDonations();
  }, [projectId]);

  return { donations, loading, error };
};
