import { supabase } from "@/integrations/supabase/client";
import { optimizeImage, validateImageFile } from "./imageOptimization";
import { getUserSession } from "./auth";

export interface UploadImageResult {
  url: string;
  path: string;
}

/**
 * Uploads an image to Supabase Storage with optimization
 * @param file - Image file to upload
 * @param folder - Optional subfolder in bucket (default: user's folder)
 * @param imageType - Type of image: 'cover' or 'gallery'
 * @returns Promise with public URL and storage path
 */
export async function uploadProjectImage(
  file: File,
  imageType: 'cover' | 'gallery' = 'gallery'
): Promise<UploadImageResult> {
  try {
    // Validate file
    validateImageFile(file, 5);

    // Get user session
    const session = getUserSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Optimize image based on type
    const optimizeOptions = imageType === 'cover' 
      ? { maxWidth: 1920, maxHeight: 1080, quality: 0.85, outputFormat: 'webp' as const }
      : { maxWidth: 1200, maxHeight: 1200, quality: 0.8, outputFormat: 'webp' as const };

    console.log(`🖼️ Optimizing ${imageType} image...`);
    const { blob } = await optimizeImage(file, optimizeOptions);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = 'webp';
    const fileName = `${imageType}_${timestamp}_${randomStr}.${extension}`;
    
    // Upload path: {userId}/{fileName}
    const filePath = `${session.nostrHexId}/${fileName}`;

    console.log(`⬆️ Uploading to: ${filePath}`);
    console.log(`📦 Bucket: project-images`);

    // Upload to Supabase Storage (public bucket, no auth required)
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(filePath, blob, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log(`✅ Upload successful, path: ${data.path}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(data.path);

    console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    throw error;
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param path - Storage path of the image to delete
 */
export async function deleteProjectImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('project-images')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log(`🗑️ Image deleted: ${path}`);
  } catch (error) {
    console.error('❌ Image deletion failed:', error);
    throw error;
  }
}
