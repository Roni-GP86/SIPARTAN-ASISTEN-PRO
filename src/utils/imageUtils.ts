/**
 * Helper to convert Google Drive sharing URLs to direct image embedding links
 */
export function formatImageUrl(urlOrPath: string): string {
  if (!urlOrPath) return '/teacher_roni.jpg';
  
  const trimmed = urlOrPath.trim();
  
  // Handle Google Drive links
  if (trimmed.includes('drive.google.com')) {
    // Extract file ID from various Drive URL formats
    // Format 1: https://drive.google.com/file/d/FILE_ID/view...
    const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1 && match1[1]) {
      return `https://lh3.googleusercontent.com/d/${match1[1]}`;
    }
    // Format 2: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
    const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) {
      return `https://lh3.googleusercontent.com/d/${match2[1]}`;
    }
  }

  return trimmed;
}
