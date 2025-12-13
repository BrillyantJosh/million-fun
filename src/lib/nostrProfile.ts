import { SimplePool, type Event } from 'nostr-tools';
import type { NostrProfile, NostrProfileTags } from '@/types/nostrProfile';

const SESSION_STORAGE_KEY = 'lana_system_parameters';
const DEFAULT_RELAYS = [
  'wss://relay.lanacoin-eternity.com',
  'wss://relay.lanaheartvoice.com'
];
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const QUERY_TIMEOUT = 15000;

const fetchProfileWithRetry = async (
  pool: SimplePool,
  relays: string[],
  nostrHexId: string,
  retries = MAX_RETRIES
): Promise<Event[]> => {
  const filter = {
    kinds: [0],
    authors: [nostrHexId],
    limit: 1
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const events = await Promise.race([
        pool.querySync(relays, filter),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
        )
      ]);
      return events;
    } catch (err) {
      console.log(`Profile fetch attempt ${attempt}/${retries} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, INITIAL_RETRY_DELAY * attempt));
    }
  }
  throw new Error('All retries failed');
};

const getRelays = (): string[] => {
  // Try to get relays from session storage
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
  
  // Fallback to default relays
  console.log('Using default relays as fallback');
  return DEFAULT_RELAYS;
};

export const fetchNostrProfile = async (nostrHexId: string): Promise<{ profile: NostrProfile; tags: NostrProfileTags } | null> => {
  const relays = getRelays();
  
  if (relays.length === 0) {
    throw new Error('No relays available. Please check your connection.');
  }

  console.log(`Fetching profile from ${relays.length} relays:`, relays);

  const pool = new SimplePool();

  try {
    // Fetch KIND 0 events with retry logic
    const events = await fetchProfileWithRetry(pool, relays, nostrHexId);

    if (events.length === 0) {
      return null; // No profile found
    }

    const event = events[0] as Event;

    // Parse profile content
    let profile: NostrProfile;
    try {
      profile = JSON.parse(event.content);
    } catch (error) {
      throw new Error('Invalid profile data format');
    }

    // Extract language tag (required)
    const langTag = event.tags.find(t => t[0] === 'lang');
    if (!langTag || !langTag[1]) {
      throw new Error('Profile missing required language tag');
    }

    // Extract interest tags ("t")
    const interestTags = event.tags.filter(t => t[0] === 't').map(t => t[1]);

    // Extract intimacy tags ("o")
    const intimacyTags = event.tags.filter(t => t[0] === 'o').map(t => t[1]);

    const profileTags: NostrProfileTags = {
      lang: langTag[1],
      interests: interestTags,
      intimacy: intimacyTags
    };

    // Validate required fields
    const requiredFields = [
      'name',
      'display_name',
      'about',
      'location',
      'country',
      'currency',
      'lanoshi2lash',
      'whoAreYou',
      'orgasmic_profile'
    ];

    for (const field of requiredFields) {
      if (!profile[field as keyof NostrProfile]) {
        throw new Error(`Profile missing required field: ${field}`);
      }
    }

    // Validate latitude and longitude if present
    if (profile.latitude !== undefined) {
      if (profile.latitude < -90 || profile.latitude > 90) {
        throw new Error('Invalid latitude value');
      }
    }

    if (profile.longitude !== undefined) {
      if (profile.longitude < -180 || profile.longitude > 180) {
        throw new Error('Invalid longitude value');
      }
    }

    return { profile, tags: profileTags };

  } catch (error) {
    throw error;
  } finally {
    pool.close(relays);
  }
};
