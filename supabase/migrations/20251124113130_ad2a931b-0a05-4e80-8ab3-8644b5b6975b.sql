-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create new policies that work with any authenticated user folder structure
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can update their images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can delete their images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');