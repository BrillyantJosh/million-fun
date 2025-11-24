-- Create admins table with only admin users
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nostr_hex_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_nostr_hex_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE nostr_hex_id = check_nostr_hex_id
  )
$$;

-- Everyone can check if someone is admin (read-only)
CREATE POLICY "Anyone can view admins"
ON public.admins
FOR SELECT
TO public
USING (true);

-- Only admins can insert new admins
CREATE POLICY "Only admins can insert admins"
ON public.admins
FOR INSERT
TO public
WITH CHECK (is_admin(nostr_hex_id));

-- Only admins can delete admins
CREATE POLICY "Only admins can delete admins"
ON public.admins
FOR DELETE
TO public
USING (is_admin(nostr_hex_id));