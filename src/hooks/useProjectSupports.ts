import { useState, useEffect } from "react";
import { SimplePool, type Filter, type Event } from "nostr-tools";
import type { LanaSystemParameters } from "@/types/nostr";

export interface ProjectSupport {
  id: string;
  projectId: string;
  supporter: string;
  projectOwner: string;
  amountLanoshis: string;
  amountFiat: string;
  currency: string;
  fromWallet: string;
  toWallet: string;
  tx: string;
  timestampPaid: number;
  message: string;
}

export interface ProjectSupportStats {
  totalRaised: number;
  currency: string;
  backersCount: number;
  supports: ProjectSupport[];
}

export const useProjectSupports = (projectId: string | null) => {
  const [stats, setStats] = useState<ProjectSupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchSupports = async () => {
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
        
        console.log("🔍 ProjectId received:", projectId);
        console.log("🔍 Filter project tag will be:", `project:${projectId}`);
        
        const filter: Filter = {
          kinds: [60200],
          "#service": ["lanacrowd"],
          "#project": [`project:${projectId}`],
        };

        console.log("🔍 Fetching supports with filter:", JSON.stringify(filter, null, 2));
        console.log("🔍 From relays:", relays);

        const events = await pool.querySync(relays, filter);
        console.log("💰 Found support events:", events.length);
        if (events.length > 0) {
          console.log("💰 First event:", events[0]);
          console.log("💰 First event tags:", events[0].tags);
        }
        pool.close(relays);

        const supports: ProjectSupport[] = [];
        const uniqueSupporters = new Set<string>();
        let totalRaised = 0;
        let currency = "EUR";

        for (const event of events) {
          try {
            const projectTag = event.tags.find((t) => t[0] === "project")?.[1];
            const supporter = event.tags.find((t) => t[0] === "p" && t[2] === "supporter")?.[1];
            const projectOwner = event.tags.find((t) => t[0] === "p" && t[2] === "project_owner")?.[1];
            const amountLanoshis = event.tags.find((t) => t[0] === "amount_lanoshis")?.[1];
            const amountFiat = event.tags.find((t) => t[0] === "amount_fiat")?.[1];
            const currencyTag = event.tags.find((t) => t[0] === "currency")?.[1];
            const fromWallet = event.tags.find((t) => t[0] === "from_wallet")?.[1];
            const toWallet = event.tags.find((t) => t[0] === "to_wallet")?.[1];
            const tx = event.tags.find((t) => t[0] === "tx")?.[1];
            const timestampPaid = event.tags.find((t) => t[0] === "timestamp_paid")?.[1];

            if (!projectTag || !supporter || !amountFiat) {
              console.log("⚠️ Skipping event - missing data:", { projectTag, supporter, amountFiat });
              continue;
            }

            console.log("✅ Processing support:", { projectTag, supporter, amountFiat, currencyTag });

            currency = currencyTag || currency;
            const fiatAmount = parseFloat(amountFiat);
            totalRaised += fiatAmount;
            uniqueSupporters.add(supporter);

            supports.push({
              id: event.id,
              projectId: projectTag.replace("project:", ""),
              supporter: supporter || "",
              projectOwner: projectOwner || "",
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
            console.error("Error parsing support event:", err);
          }
        }

        console.log("📊 Final stats:", {
          totalRaised,
          currency,
          backersCount: uniqueSupporters.size,
          supportsCount: supports.length,
        });

        setStats({
          totalRaised,
          currency,
          backersCount: uniqueSupporters.size,
          supports,
        });
      } catch (err) {
        console.error("Error fetching supports:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch supports");
      } finally {
        setLoading(false);
      }
    };

    fetchSupports();
  }, [projectId]);

  return { stats, loading, error };
};
