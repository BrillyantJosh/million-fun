-- Create projects table to track project restrictions
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nostr_event_id TEXT NOT NULL UNIQUE,
  restricted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Everyone can view projects
CREATE POLICY "Anyone can view projects"
ON public.projects
FOR SELECT
TO public
USING (true);

-- Only admins can insert projects
CREATE POLICY "Only admins can insert projects"
ON public.projects
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins WHERE nostr_hex_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Only admins can update projects
CREATE POLICY "Only admins can update projects"
ON public.projects
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.admins WHERE nostr_hex_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Only admins can delete projects
CREATE POLICY "Only admins can delete projects"
ON public.projects
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.admins WHERE nostr_hex_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Create index for faster lookups
CREATE INDEX idx_projects_nostr_event_id ON public.projects(nostr_event_id);
CREATE INDEX idx_projects_restricted ON public.projects(restricted);