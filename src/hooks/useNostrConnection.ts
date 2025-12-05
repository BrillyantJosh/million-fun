import { useState, useEffect } from 'react';
import { SimplePool, type Event, type Filter } from 'nostr-tools';
import type { LanaSystemParameters, RelayStatus } from '@/types/nostr';

const AUTHORIZED_PUBKEY = '9eb71bf1e9c3189c78800e4c3831c1c1a93ab43b61118818c32e4490891a35b3';
const DEFAULT_RELAYS = [
  'wss://relay.lanacoin-eternity.com',
  'wss://relay.lanaheartvoice.com'
];

const SESSION_STORAGE_KEY = 'lana_system_parameters';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const QUERY_TIMEOUT = 10000;

const fetchWithRetry = async (
  pool: SimplePool, 
  relays: string[], 
  filter: Filter, 
  retries = MAX_RETRIES
): Promise<Event[]> => {
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
      console.log(`Nostr query attempt ${attempt}/${retries} failed:`, err);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, INITIAL_RETRY_DELAY * attempt));
    }
  }
  throw new Error('All retries failed');
};

export const useNostrConnection = () => {
  const [parameters, setParameters] = useState<LanaSystemParameters | null>(null);
  const [relayStatuses, setRelayStatuses] = useState<RelayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemParameters = async () => {
      const pool = new SimplePool();
      const statuses: RelayStatus[] = DEFAULT_RELAYS.map(url => ({ url, connected: false }));
      setRelayStatuses(statuses);
      
      let hasCachedData = false;

      try {
        // Check session storage first
        const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          setParameters(data.parameters);
          setRelayStatuses(data.relayStatuses);
          setLoading(false);
          hasCachedData = true;
        }

        // Fetch KIND 38888 event with retry
        const filter: Filter = {
          kinds: [38888],
          authors: [AUTHORIZED_PUBKEY],
          '#d': ['main'],
          limit: 1
        };

        const startTimes = new Map<string, number>();
        DEFAULT_RELAYS.forEach(relay => startTimes.set(relay, Date.now()));

        const events = await fetchWithRetry(pool, DEFAULT_RELAYS, filter);
        
        if (events.length === 0) {
          throw new Error('No KIND 38888 event found from authorized publisher');
        }

        const event = events[0] as Event;

        // Verify the event
        if (event.pubkey !== AUTHORIZED_PUBKEY) {
          throw new Error('Event not from authorized publisher');
        }

        const dTag = event.tags.find(t => t[0] === 'd' && t[1] === 'main');
        if (!dTag) {
          throw new Error('Event does not have d-tag "main"');
        }

        // Parse the content
        const content = JSON.parse(event.content);
        
        // Extract parameters from tags
        const relays = event.tags.filter(t => t[0] === 'relay').map(t => t[1]);
        const electrum = event.tags
          .filter(t => t[0] === 'electrum')
          .map(t => ({ host: t[1], port: t[2] }));
        const fxTags = event.tags.filter(t => t[0] === 'fx');
        const fx = {
          EUR: parseFloat(fxTags.find(t => t[1] === 'EUR')?.[2] || '0'),
          USD: parseFloat(fxTags.find(t => t[1] === 'USD')?.[2] || '0'),
          GBP: parseFloat(fxTags.find(t => t[1] === 'GBP')?.[2] || '0')
        };
        const split = event.tags.find(t => t[0] === 'split')?.[1] || '';
        const version = event.tags.find(t => t[0] === 'version')?.[1] || '';
        const valid_from = event.tags.find(t => t[0] === 'valid_from')?.[1] || '';

        const systemParams: LanaSystemParameters = {
          relays,
          electrum,
          fx,
          split,
          version,
          valid_from,
          trusted_signers: content.trusted_signers || {}
        };

        // Update relay statuses with actual relays from the event and calculate latency
        const updatedStatuses: RelayStatus[] = relays.map(url => {
          const startTime = startTimes.get(url);
          return {
            url,
            connected: true,
            latency: startTime ? Date.now() - startTime : undefined
          };
        });

        // Add default relays if not in the list
        DEFAULT_RELAYS.forEach(relay => {
          if (!updatedStatuses.find(s => s.url === relay)) {
            const startTime = startTimes.get(relay);
            updatedStatuses.push({
              url: relay,
              connected: true,
              latency: startTime ? Date.now() - startTime : undefined
            });
          }
        });

        setParameters(systemParams);
        setRelayStatuses(updatedStatuses);

        // Store in session storage
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          parameters: systemParams,
          relayStatuses: updatedStatuses
        }));

      } catch (err) {
        console.error('Error fetching Nostr data:', err);
        // Only show error to user if we don't have cached data
        if (!hasCachedData) {
          setError(err instanceof Error ? err.message : 'Failed to connect to Nostr network');
        }
      } finally {
        setLoading(false);
        pool.close(DEFAULT_RELAYS);
      }
    };

    fetchSystemParameters();
  }, []);

  return { parameters, relayStatuses, loading, error };
};
