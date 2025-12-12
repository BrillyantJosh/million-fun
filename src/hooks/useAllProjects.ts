import { useState, useEffect } from "react";
import { SimplePool, Filter } from "nostr-tools";
import type { LanaSystemParameters } from "@/types/nostr";
import type { NostrProfile } from "@/types/nostrProfile";

export type ProjectStatus = 'draft' | 'active';

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
  projectType?: string;
  status?: ProjectStatus;
}

const MAX_WAIT_ATTEMPTS = 10;
const WAIT_INTERVAL = 500;

const waitForSystemParams = async (): Promise<string | null> => {
  for (let i = 0; i < MAX_WAIT_ATTEMPTS; i++) {
    const params = sessionStorage.getItem("lana_system_parameters");
    if (params) return params;
    await new Promise(r => setTimeout(r, WAIT_INTERVAL));
  }
  return null;
};

export const useAllProjects = (includeBlocked = false) => {
  const [projects, setProjects] = useState<NostrProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllProjects = async () => {
      // Wait for system parameters with retry
      const systemParamsStr = await waitForSystemParams();
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
              projectType: getTag("project_type"),
              status: (getTag("status") as ProjectStatus) || 'draft',
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

        // Fetch visibility status (KIND 31235) if not including blocked projects
        let filteredProjects = parsedProjects;
        if (!includeBlocked) {
          try {
            const AUTHORITY_PUBKEY = "18a908e89354fb2d142d864bfcbea7a7ed4486c8fb66b746fcebe66ed372115e";
            const pool3 = new SimplePool();
            const visibilityFilter: Filter = {
              kinds: [31235],
              authors: [AUTHORITY_PUBKEY],
            };

            const visibilityEvents = await pool3.querySync(relays, visibilityFilter);
            pool3.close(relays);

            console.log('🔍 Visibility events found:', visibilityEvents.length);

            // Create a map of project ID -> visibility status
            const visibilityMap = new Map<string, string>();
            for (const event of visibilityEvents) {
              const dTag = event.tags.find(t => t[0] === "d")?.[1];
              const statusTag = event.tags.find(t => t[0] === "status")?.[1];
              
              if (dTag && statusTag) {
                const projectId = dTag.replace("project:", "");
                const existing = visibilityMap.get(projectId);
                
                // Keep most recent visibility status
                if (!existing) {
                  visibilityMap.set(projectId, statusTag);
                }
              }
            }

            // Filter out blocked projects
            filteredProjects = parsedProjects.filter(project => {
              const visibilityStatus = visibilityMap.get(project.id);
              // If no KIND 31235 exists, project is visible by default
              // Only hide if explicitly blocked
              if (visibilityStatus === 'blocked') {
                console.log(`🚫 Filtering out blocked project: ${project.id}`);
                return false;
              }
              // Also filter out draft projects from public views
              if (project.status === 'draft') {
                console.log(`📝 Filtering out draft project: ${project.id}`);
                return false;
              }
              return true;
            });

            console.log(`✅ Filtered projects: ${filteredProjects.length} visible out of ${parsedProjects.length} total`);
          } catch (err) {
            console.error("Error fetching visibility status:", err);
            // If visibility check fails, show all projects (fail open)
            filteredProjects = parsedProjects;
          }
        }

        console.log('🌍 Final projects:', filteredProjects);
        setProjects(filteredProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProjects();
  }, [includeBlocked]);

  return { projects, loading, error };
};
