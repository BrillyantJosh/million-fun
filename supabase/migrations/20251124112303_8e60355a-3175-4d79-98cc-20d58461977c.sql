-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS Policy: Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own project images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Allow public read access to all project images
CREATE POLICY "Anyone can view project images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- RLS Policy: Allow users to update their own images
CREATE POLICY "Users can update their own project images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Allow users to delete their own images
CREATE POLICY "Users can delete their own project images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);