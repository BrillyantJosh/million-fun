-- Enable public read access to project images
CREATE POLICY "Anyone can view project images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-images');