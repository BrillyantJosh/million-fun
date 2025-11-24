/**
 * Image optimization utilities for web
 * Resizes and compresses images before upload to save storage and bandwidth
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: OptimizeImageOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  outputFormat: 'webp'
};

/**
 * Optimizes an image file for web use
 * @param file - The image file to optimize
 * @param options - Optimization options
 * @returns Promise with optimized blob and metadata
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<{ blob: Blob; width: number; height: number; originalSize: number; optimizedSize: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      const originalSize = file.size;

      // Calculate new dimensions maintaining aspect ratio
      if (opts.maxWidth && width > opts.maxWidth) {
        height = Math.round((height * opts.maxWidth) / width);
        width = opts.maxWidth;
      }

      if (opts.maxHeight && height > opts.maxHeight) {
        width = Math.round((width * opts.maxHeight) / height);
        height = opts.maxHeight;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to optimized blob
      const mimeType = opts.outputFormat === 'jpeg' 
        ? 'image/jpeg' 
        : opts.outputFormat === 'png'
        ? 'image/png'
        : 'image/webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          console.log(`✅ Image optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / originalSize) * 100)}% reduction)`);

          resolve({
            blob,
            width,
            height,
            originalSize,
            optimizedSize: blob.size
          });
        },
        mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Validates image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5MB)
 * @returns true if valid, throws error otherwise
 */
export function validateImageFile(file: File, maxSizeMB: number = 5): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP images.');
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size too large. Maximum size is ${maxSizeMB}MB.`);
  }

  return true;
}
