-- Drop existing restrictive policies on storage.objects for project-images bucket
DROP POLICY IF EXISTS "Users can upload their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project images" ON storage.objects;

-- Create permissive policies for public project-images bucket
-- Anyone can upload to project-images (it's a public bucket)
CREATE POLICY "Anyone can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images');

-- Anyone can update project images
CREATE POLICY "Anyone can update project images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-images');

-- Anyone can delete project images
CREATE POLICY "Anyone can delete project images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images');