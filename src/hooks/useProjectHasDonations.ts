import { useState, useEffect } from "react";
import { SimplePool, type Filter } from "nostr-tools";
import type { LanaSystemParameters } from "@/types/nostr";

export const useProjectHasDonations = (projectId: string | null) => {
  const [hasDonations, setHasDonations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const checkDonations = async () => {
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
          limit: 500,
        };

        const events = await pool.querySync(relays, filter);
        pool.close(relays);

        // Check if any donation exists for this project
        const projectTag = `project:${projectId}`;
        const donationExists = events.some((event) => {
          const serviceTag = event.tags.find((t) => t[0] === "service")?.[1];
          const eventProjectTag = event.tags.find((t) => t[0] === "project")?.[1];
          return serviceTag === "lanacrowd" && eventProjectTag === projectTag;
        });

        console.log(`🔍 Project ${projectId} has donations:`, donationExists);
        setHasDonations(donationExists);
      } catch (err) {
        console.error("Error checking donations:", err);
        setError(err instanceof Error ? err.message : "Failed to check donations");
      } finally {
        setLoading(false);
      }
    };

    checkDonations();
  }, [projectId]);

  return { hasDonations, loading, error };
};
