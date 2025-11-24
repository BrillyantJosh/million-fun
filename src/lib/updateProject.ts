import { SimplePool } from 'nostr-tools/pool';
import { finalizeEvent, EventTemplate } from 'nostr-tools/pure';

function hexToBytes(h: string): Uint8Array {
  if (h.length % 2) throw new Error('Invalid hex string');
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < a.length; i++) {
    a[i] = parseInt(h.slice(2 * i, 2 * i + 2), 16);
  }
  return a;
}

export interface ProjectData {
  title: string;
  shortDesc: string;
  longDesc: string;
  fiatGoal: string;
  currency: string;
  walletId: string;
  responsibilityStatement: string;
  videoUrl?: string;
  images?: string[];
  coverImage?: string;
}

export interface PublishResult {
  relay: string;
  success: boolean;
  error?: string;
}

export async function updateProjectOnNostr(
  projectUuid: string,
  projectData: ProjectData,
  privateKeyHex: string,
  ownerNostrHex: string,
  relays: string[]
): Promise<{ eventId: string; results: PublishResult[] }> {
  
  // Clean fiat goal (remove thousands separator)
  const cleanFiatGoal = projectData.fiatGoal.replace(/,/g, '');
  
  // Build tags array
  const tags: string[][] = [
    ["d", `project:${projectUuid}`],
    ["service", "lanacrowd"],
    ["title", projectData.title],
    ["short_desc", projectData.shortDesc],
    ["fiat_goal", cleanFiatGoal],
    ["currency", projectData.currency],
    ["wallet", projectData.walletId],
    ["responsibility_statement", projectData.responsibilityStatement],
    ["p", ownerNostrHex, "owner"],
    ["timestamp_created", Math.floor(Date.now() / 1000).toString()]
  ];

  // Add optional video
  if (projectData.videoUrl) {
    tags.push(["video", projectData.videoUrl, "primary"]);
  }

  // Add cover image
  if (projectData.coverImage) {
    tags.push(["img", projectData.coverImage, "cover"]);
  }

  // Add gallery images
  if (projectData.images && projectData.images.length > 0) {
    projectData.images.forEach((imgUrl) => {
      tags.push(["img", imgUrl, "gallery"]);
    });
  }

  // Create event template (replaceable KIND 31234)
  const eventTemplate: EventTemplate = {
    kind: 31234,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: projectData.longDesc
  };

  // Sign event
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);

  console.log('✍️ Project update event signed:', {
    id: signedEvent.id,
    kind: signedEvent.kind,
    pubkey: signedEvent.pubkey,
    projectId: projectUuid
  });

  // Publish to relays
  const pool = new SimplePool();
  const results: PublishResult[] = [];

  try {
    const publishPromises = relays.map(async (relay: string) => {
      console.log(`🔄 Updating project on ${relay}...`);

      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          results.push({
            relay,
            success: false,
            error: 'Connection timeout (10s)'
          });
          console.error(`❌ ${relay}: Timeout`);
          resolve();
        }, 10000);

        try {
          const pubs = pool.publish([relay], signedEvent);

          Promise.race([
            Promise.all(pubs),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Publish timeout')), 8000)
            )
          ]).then(() => {
            clearTimeout(timeout);
            results.push({ relay, success: true });
            console.log(`✅ ${relay}: Project updated successfully`);
            resolve();
          }).catch((error) => {
            clearTimeout(timeout);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            results.push({ relay, success: false, error: errorMsg });
            console.error(`❌ ${relay}: ${errorMsg}`);
            resolve();
          });
        } catch (error) {
          clearTimeout(timeout);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.push({ relay, success: false, error: errorMsg });
          console.error(`❌ ${relay}: ${errorMsg}`);
          resolve();
        }
      });
    });

    await Promise.all(publishPromises);

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log('📊 Project update summary:', {
      eventId: signedEvent.id,
      projectId: projectUuid,
      total: results.length,
      successful: successCount,
      failed: failedCount,
      details: results
    });

    if (successCount === 0) {
      throw new Error('Failed to update project on any relay');
    }

    return { eventId: signedEvent.id, results };

  } finally {
    pool.close(relays);
  }
}
