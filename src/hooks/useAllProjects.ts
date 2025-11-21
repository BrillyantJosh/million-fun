import { useState, useEffect } from "react";
import { SimplePool, Filter } from "nostr-tools";
import type { LanaSystemParameters } from "@/types/nostr";

export interface NostrProject {
  id: string;
  eventId: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  fiatGoal: string;
  currency: string;
  coverImage: string;
  videoUrl: string;
  walletId: string;
  owner: string;
  createdAt: number;
  responsibilityStatement?: string;
}

export const useAllProjects = () => {
  const [projects, setProjects] = useState<NostrProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllProjects = async () => {
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

        console.log('🌍 Fetching ALL projects from relays:', relays);

        if (!relays || relays.length === 0) {
          setError("No relays configured");
          setLoading(false);
          return;
        }

        const pool = new SimplePool();
        const filter: Filter = {
          kinds: [31234],
          "#service": ["lanacrowd"],
        };

        const events = await pool.querySync(relays, filter);
        pool.close(relays);

        console.log('🌍 Total events found:', events.length);

        // Deduplicate by 'd' tag (keep most recent)
        const projectMap = new Map<string, typeof events[0]>();
        events.forEach((event) => {
          const dTag = event.tags.find((t) => t[0] === "d")?.[1];
          if (!dTag) return;

          const existing = projectMap.get(dTag);
          if (!existing || event.created_at > existing.created_at) {
            projectMap.set(dTag, event);
          }
        });

        console.log('🌍 Unique projects after deduplication:', projectMap.size);

        const parsedProjects: NostrProject[] = [];

        for (const event of projectMap.values()) {
          try {
            const dTag = event.tags.find((t) => t[0] === "d")?.[1];
            if (!dTag) continue;

            const title = event.tags.find((t) => t[0] === "title")?.[1] || "Untitled";
            const shortDesc = event.tags.find((t) => t[0] === "short_desc")?.[1] || "";
            const fiatGoal = event.tags.find((t) => t[0] === "fiat_goal")?.[1] || "0";
            const currency = event.tags.find((t) => t[0] === "currency")?.[1] || "EUR";
            const coverImage = event.tags.find((t) => t[0] === "cover_image")?.[1] || "";
            const videoUrl = event.tags.find((t) => t[0] === "video_url")?.[1] || "";
            const walletId = event.tags.find((t) => t[0] === "wallet_id")?.[1] || "";

            const fullDesc = event.content || "";

            const responsibilityTag = event.tags.find((t) => t[0] === "responsibility_statement");
            const responsibilityStatement = responsibilityTag ? responsibilityTag[1] : undefined;

            parsedProjects.push({
              id: dTag,
              eventId: event.id,
              title,
              shortDesc,
              fullDesc,
              fiatGoal,
              currency,
              coverImage,
              videoUrl,
              walletId,
              owner: event.pubkey,
              createdAt: event.created_at,
              responsibilityStatement,
            });
          } catch (err) {
            console.error("Error parsing project event:", err);
          }
        }

        console.log('🌍 Parsed projects:', parsedProjects);
        setProjects(parsedProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProjects();
  }, []);

  return { projects, loading, error };
};

