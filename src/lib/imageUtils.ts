/**
 * Adds a cache-busting parameter to Supabase storage URLs
 * to force browsers and CDNs to fetch fresh versions of images
 */
export function getCacheBreakingImageUrl(url: string | undefined): string {
  if (!url) return "";
  
  // Only add cache-busting parameter to Supabase storage URLs
  if (!url.includes('supabase.co/storage')) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=1`;
}
