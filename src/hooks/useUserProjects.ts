import { useEffect, useState } from "react";
import { SimplePool } from "nostr-tools/pool";
import { getUserSession } from "@/lib/auth";
import type { LanaSystemParameters } from "@/types/nostr";
import type { Project } from "@/types/project";

export type ProjectStatus = 'draft' | 'active';

export interface NostrProject {
  id: string;
  eventId: string;
  title: string;
  shortDesc: string;
  longDesc: string;
  fiatGoal: string;
  currency: string;
  walletId: string;
  coverImage?: string;
  galleryImages: string[];
  videoUrl?: string;
  owner: string;
  createdAt: number;
  responsibilityStatement?: string;
  participants?: string[]; // Array of participant pubkeys
  projectType?: string;
  status?: ProjectStatus;
}

export const useUserProjects = () => {
  const [projects, setProjects] = useState<NostrProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
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

        console.log('🔍 Fetching projects from relays:', relays);
        console.log('🔍 Looking for owner pubkey:', session.nostrHexId);

        if (!relays || relays.length === 0) {
          setError("No relays configured");
          setLoading(false);
          return;
        }

        const pool = new SimplePool();
        
        try {
          // Fetch KIND 31234 events where user is owner
          const eventPromises = relays.map(async (relay) => {
            console.log(`🔄 Querying ${relay} for KIND 31234...`);
            
            return new Promise<any[]>((resolve) => {
              const timeout = setTimeout(() => {
                console.warn(`⏱️ ${relay}: Timeout (5s)`);
                resolve([]);
              }, 5000);

              try {
                pool.querySync([relay], {
                  kinds: [31234],
                  "#p": [session.nostrHexId],
                  limit: 50
                }).then((events) => {
                  clearTimeout(timeout);
                  console.log(`✅ ${relay}: Found ${events.length} events`);
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
            console.warn('⚠️ No project events found for user');
            setProjects([]);
            setLoading(false);
            return;
          }

          // Deduplicate by "d" tag, keeping the most recent event
          const eventsByDTag = new Map<string, any>();
          allEvents.forEach((event: any) => {
            const dTag = event.tags.find((t: string[]) => t[0] === "d")?.[1];
            if (dTag) {
              const existing = eventsByDTag.get(dTag);
              if (!existing || event.created_at > existing.created_at) {
                eventsByDTag.set(dTag, event);
              }
            }
          });

          const uniqueEvents = Array.from(eventsByDTag.values());
          console.log('📊 Unique events after deduplication:', uniqueEvents.length);

          // Parse projects from events
          const parsedProjects: NostrProject[] = uniqueEvents
            .filter(event => {
              // Only include events where user is the owner
              const ownerTags = event.tags.filter(
                (tag: string[]) => tag[0] === "p" && tag[2] === "owner"
              );
              return ownerTags.some((tag: string[]) => tag[1] === session.nostrHexId);
            })
            .map((event: any) => {
              const getTag = (name: string) => {
                const tag = event.tags.find((t: string[]) => t[0] === name);
                return tag ? tag[1] : undefined;
              };

              const getAllTags = (name: string, type?: string) => {
                return event.tags
                  .filter((t: string[]) => t[0] === name && (!type || t[2] === type))
                  .map((t: string[]) => t[1]);
              };

              const projectId = getTag("d") || "";
              const coverImages = event.tags.filter(
                (t: string[]) => t[0] === "img" && t[2] === "cover"
              );
              const galleryImages = getAllTags("img", "gallery");

              return {
                id: projectId.replace("project:", ""),
                eventId: event.id,
                title: getTag("title") || "Untitled Project",
                shortDesc: getTag("short_desc") || "",
                longDesc: event.content || "",
                fiatGoal: getTag("fiat_goal") || "0",
                currency: getTag("currency") || "EUR",
                walletId: getTag("wallet") || "",
                coverImage: coverImages.length > 0 ? coverImages[0][1] : undefined,
                galleryImages,
                videoUrl: getTag("video"),
                owner: session.nostrHexId,
                createdAt: event.created_at,
                responsibilityStatement: getTag("responsibility_statement"),
                participants: getAllTags("p", "participant"),
                projectType: getTag("project_type"),
                status: (getTag("status") as ProjectStatus) || 'draft'
              };
            });

          console.log('💰 Parsed projects:', parsedProjects);
          setProjects(parsedProjects);
          setLoading(false);
        } finally {
          pool.close(relays);
        }
      } catch (err) {
        console.error('❌ Error fetching projects:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch projects");
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
};
