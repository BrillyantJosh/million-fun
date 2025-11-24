-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project images" ON storage.objects;

-- Create new policies that allow anon role to upload
-- Since this app uses Nostr auth (not Supabase auth), we need to allow anon role
CREATE POLICY "Allow anon to upload images"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Allow anon to update images"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'project-images');

CREATE POLICY "Allow anon to delete images"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'project-images');

CREATE POLICY "Public can view project images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-images');