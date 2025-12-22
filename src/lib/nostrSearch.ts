import { SimplePool, type Event } from 'nostr-tools';

const SESSION_STORAGE_KEY = 'lana_system_parameters';
const DEFAULT_RELAYS = [
  'wss://relay.lanacoin-eternity.com',
  'wss://relay.lanaheartvoice.com'
];
const QUERY_TIMEOUT = 10000;

interface NostrSearchResult {
  pubkey: string;
  name?: string;
  display_name?: string;
  picture?: string;
}

const getRelays = (): string[] => {
  const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
  
  if (cached) {
    try {
      const { relayStatuses } = JSON.parse(cached);
      const connectedRelays = relayStatuses
        .filter((r: any) => r.connected)
        .map((r: any) => r.url);
      
      if (connectedRelays.length > 0) {
        return connectedRelays;
      }
    } catch (e) {
      console.warn('Failed to parse cached relay data:', e);
    }
  }
  
  return DEFAULT_RELAYS;
};

export const searchNostrProfiles = async (searchQuery: string): Promise<NostrSearchResult[]> => {
  if (!searchQuery || searchQuery.length < 2) {
    return [];
  }

  const relays = getRelays();
  
  if (relays.length === 0) {
    throw new Error('No relays available');
  }

  console.log(`Searching profiles on ${relays.length} relays for: "${searchQuery}"`);

  const pool = new SimplePool();

  try {
    // Fetch recent KIND 0 events (profiles) - we'll filter client-side by name/display_name
    // Note: NIP doesn't support text search, so we fetch recent profiles and filter
    const filter = {
      kinds: [0],
      limit: 100
    };

    const events = await Promise.race([
      pool.querySync(relays, filter),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), QUERY_TIMEOUT)
      )
    ]) as Event[];

    const searchLower = searchQuery.toLowerCase();
    const results: NostrSearchResult[] = [];
    const seenPubkeys = new Set<string>();

    for (const event of events) {
      if (seenPubkeys.has(event.pubkey)) continue;

      try {
        const profile = JSON.parse(event.content);
        const name = (profile.name || '').toLowerCase();
        const displayName = (profile.display_name || '').toLowerCase();

        // Match against name or display_name
        if (name.includes(searchLower) || displayName.includes(searchLower)) {
          seenPubkeys.add(event.pubkey);
          results.push({
            pubkey: event.pubkey,
            name: profile.name,
            display_name: profile.display_name,
            picture: profile.picture
          });
        }
      } catch (e) {
        // Skip malformed profiles
      }
    }

    return results.slice(0, 20); // Limit to 20 results

  } finally {
    pool.close(relays);
  }
};
