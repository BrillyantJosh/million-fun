import { useState, useEffect } from "react";
import { SimplePool, Filter } from "nostr-tools";
import type { LanaSystemParameters } from "@/types/nostr";
import type { NostrProfile } from "@/types/nostrProfile";
import { supabase } from "@/integrations/supabase/client";

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
  ownerProfile?: NostrProfile;
  createdAt: number;
  responsibilityStatement?: string;
  restricted?: boolean;
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
          limit: 100
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
            // Helper functions matching useUserProjects
            const getTag = (name: string) => {
              const tag = event.tags.find((t: string[]) => t[0] === name);
              return tag ? tag[1] : undefined;
            };

            const projectId = getTag("d") || "";
            const coverImages = event.tags.filter(
              (t: string[]) => t[0] === "img" && t[2] === "cover"
            );

            // Parse owner from tags (p tag with "owner" role) or fallback to pubkey
            const ownerTag = event.tags.find(
              (t: string[]) => t[0] === "p" && t[2] === "owner"
            );
            const owner = ownerTag ? ownerTag[1] : event.pubkey;

            parsedProjects.push({
              id: projectId.replace("project:", ""),
              eventId: event.id,
              title: getTag("title") || "Untitled Project",
              shortDesc: getTag("short_desc") || "",
              fullDesc: event.content || "",
              fiatGoal: getTag("fiat_goal") || "0",
              currency: getTag("currency") || "EUR",
              coverImage: coverImages.length > 0 ? coverImages[0][1] : "",
              videoUrl: getTag("video") || "",
              walletId: getTag("wallet") || "",
              owner,
              createdAt: event.created_at,
              responsibilityStatement: getTag("responsibility_statement"),
            });
          } catch (err) {
            console.error("Error parsing project event:", err);
          }
        }

        // Fetch owner profiles
        const ownerPubkeys = [...new Set(parsedProjects.map(p => p.owner))];
        if (ownerPubkeys.length > 0) {
          try {
            const pool2 = new SimplePool();
            const profileFilter: Filter = {
              kinds: [0],
              authors: ownerPubkeys,
            };

            const profileEvents = await pool2.querySync(relays, profileFilter);
            pool2.close(relays);

            // Create a map of pubkey -> profile
            const profileMap = new Map<string, NostrProfile>();
            for (const profileEvent of profileEvents) {
              try {
                const profile: NostrProfile = JSON.parse(profileEvent.content);
                const existing = profileMap.get(profileEvent.pubkey);
                // Keep most recent profile (profileEvent has created_at, not profile)
                if (!existing) {
                  profileMap.set(profileEvent.pubkey, profile);
                }
              } catch (err) {
                console.error("Error parsing owner profile:", err);
              }
            }

            // Add profiles to projects
            parsedProjects.forEach(project => {
              const profile = profileMap.get(project.owner);
              if (profile) {
                project.ownerProfile = profile;
              }
            });
          } catch (err) {
            console.error("Error fetching owner profiles:", err);
          }
        }

        // Fetch restricted status from database
        const eventIds = parsedProjects.map(p => p.eventId);
        if (eventIds.length > 0) {
          try {
            const { data: restrictedData, error: restrictedError } = await supabase
              .from("projects")
              .select("nostr_event_id, restricted")
              .in("nostr_event_id", eventIds);

            if (!restrictedError && restrictedData) {
              const restrictedMap = new Map(
                restrictedData.map(item => [item.nostr_event_id, item.restricted])
              );

              parsedProjects.forEach(project => {
                project.restricted = restrictedMap.get(project.eventId) || false;
              });
            }
          } catch (err) {
            console.error("Error fetching restricted status:", err);
          }
        }

        // Filter out restricted projects for public view
        const publicProjects = parsedProjects.filter(p => !p.restricted);

        console.log('🌍 Parsed projects:', publicProjects);
        setProjects(publicProjects);
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

