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

export interface BlockProjectResult {
  relay: string;
  success: boolean;
  error?: string;
}

/**
 * Publishes KIND 31235 event to block or unblock a project
 * @param projectId - UUID of the project
 * @param status - "blocked" or "visible"
 * @param reason - Human-readable explanation
 * @param privateKeyHex - Authority private key (must match authority pubkey)
 * @param relays - Array of relay URLs
 * @returns Promise with eventId and results per relay
 */
export async function publishProjectVisibility(
  projectId: string,
  status: 'blocked' | 'visible',
  reason: string,
  privateKeyHex: string,
  relays: string[]
): Promise<{ eventId: string; results: BlockProjectResult[] }> {
  
  // Build tags array for KIND 31235
  const tags: string[][] = [
    ["d", `project:${projectId}`],
    ["service", "lanacrowd"],
    ["status", status],
    ["timestamp_update", Math.floor(Date.now() / 1000).toString()]
  ];

  // Create event template (KIND 31235)
  const eventTemplate: EventTemplate = {
    kind: 31235,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: reason
  };

  // Sign event
  const privateKeyBytes = hexToBytes(privateKeyHex);
  const signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);

  console.log('✍️ Project visibility event signed:', {
    id: signedEvent.id,
    kind: signedEvent.kind,
    pubkey: signedEvent.pubkey,
    projectId,
    status
  });

  // Publish to relays
  const pool = new SimplePool();
  const results: BlockProjectResult[] = [];

  try {
    const publishPromises = relays.map(async (relay: string) => {
      console.log(`🔄 Publishing visibility status to ${relay}...`);

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
            console.log(`✅ ${relay}: Visibility status published successfully`);
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

    console.log('📊 Visibility status publishing summary:', {
      eventId: signedEvent.id,
      projectId,
      status,
      total: results.length,
      successful: successCount,
      failed: failedCount,
      details: results
    });

    if (successCount === 0) {
      throw new Error('Failed to publish visibility status to any relay');
    }

    return { eventId: signedEvent.id, results };

  } finally {
    pool.close(relays);
  }
}
