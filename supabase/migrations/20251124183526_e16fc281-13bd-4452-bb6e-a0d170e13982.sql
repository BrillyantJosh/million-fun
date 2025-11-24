-- Add authority nostr credentials to app_settings
ALTER TABLE public.app_settings
ADD COLUMN nostr_key TEXT,
ADD COLUMN nostr_hex_id TEXT;