import { SimplePool, type Event } from 'nostr-tools';
import type { NostrProfile, NostrProfileTags } from '@/types/nostrProfile';

const SESSION_STORAGE_KEY = 'lana_system_parameters';

export const fetchNostrProfile = async (nostrHexId: string): Promise<{ profile: NostrProfile; tags: NostrProfileTags } | null> => {
  // Get relays from session storage
  const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!cached) {
    throw new Error('No Nostr relays available. Please refresh the page.');
  }

  const { relayStatuses } = JSON.parse(cached);
  const relays = relayStatuses
    .filter((r: any) => r.connected)
    .map((r: any) => r.url);

  if (relays.length === 0) {
    throw new Error('No connected relays available');
  }

  const pool = new SimplePool();

  try {
    // Fetch KIND 0 events for this user
    const filter = {
      kinds: [0],
      authors: [nostrHexId],
      limit: 1
    };

    const events = await pool.querySync(relays, filter);

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
