-- Create enum for project type roles (excluding 'inspiration' which is default for all)
CREATE TYPE public.project_type_role AS ENUM ('enhancement', 'agreement', 'awareness');

-- Create table for user project permissions
CREATE TABLE public.user_project_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nostr_hex_id text NOT NULL,
    project_type project_type_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by text,
    UNIQUE (nostr_hex_id, project_type)
);

-- Enable RLS
ALTER TABLE public.user_project_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view user project roles" 
ON public.user_project_roles FOR SELECT USING (true);

CREATE POLICY "Only admins can insert user project roles" 
ON public.user_project_roles FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM admins LIMIT 1));

CREATE POLICY "Only admins can delete user project roles" 
ON public.user_project_roles FOR DELETE 
USING (EXISTS (SELECT 1 FROM admins LIMIT 1));