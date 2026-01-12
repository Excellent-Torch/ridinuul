export type LoadingStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'error';

// Configuration - set this to your server URL
// For local development: http://localhost:8000
// For production: https://your-vps-ip:8000 or your domain
const RECOLOR_API_URL = import.meta.env.VITE_RECOLOR_API_URL || 'http://localhost:8000';

/**
 * Check if the recolor API server is available
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${RECOLOR_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    console.warn('Recolor API server is not available');
    return false;
  }
}

/**
 * Convert hex color to RGB tuple
 */
export function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16)
  ];
}

/**
 * Fetch an image URL and convert to Blob
 */
async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Recolor clothing in an image using the YOLO-based API
 * 
 * @param imageUrl - URL of the image to recolor
 * @param targetColor - Hex color code (e.g., '#FF0000')
 * @param onStatusChange - Callback for status updates
 * @returns Data URL of the recolored image, or original URL on failure
 */
export async function recolorClothing(
  imageUrl: string,
  targetColor: string,
  onStatusChange?: (status: LoadingStatus) => void
): Promise<string> {
  try {
    onStatusChange?.('loading');

    // Check if server is available
    const isServerHealthy = await checkServerHealth();
    if (!isServerHealthy) {
      console.warn('Recolor server unavailable, returning original image');
      onStatusChange?.('ready');
      return imageUrl;
    }

    onStatusChange?.('processing');

    // Fetch the image and convert to blob
    const imageBlob = await fetchImageAsBlob(imageUrl);

    // Prepare form data for the API
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('color', targetColor);

    // Call the recolor API
    const response = await fetch(`${RECOLOR_API_URL}/recolor`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Recolor API error: ${response.status} - ${errorText}`);
    }

    // Get the recolored image as blob
    const recoloredBlob = await response.blob();

    // Convert blob to data URL for display
    const dataUrl = await blobToDataUrl(recoloredBlob);

    onStatusChange?.('ready');
    return dataUrl;
  } catch (error) {
    console.error('Recolor error:', error);
    onStatusChange?.('error');
    // Return original image on error so user experience isn't broken
    return imageUrl;
  }
}

/**
 * Convert a Blob to a data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Recolor clothing with a File input (useful for file uploads)
 * 
 * @param file - Image file to recolor
 * @param targetColor - Hex color code (e.g., '#FF0000')
 * @param onStatusChange - Callback for status updates
 * @returns Data URL of the recolored image
 */
export async function recolorClothingFromFile(
  file: File,
  targetColor: string,
  onStatusChange?: (status: LoadingStatus) => void
): Promise<string> {
  try {
    onStatusChange?.('loading');

    const isServerHealthy = await checkServerHealth();
    if (!isServerHealthy) {
      throw new Error('Recolor server is not available');
    }

    onStatusChange?.('processing');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('color', targetColor);

    const response = await fetch(`${RECOLOR_API_URL}/recolor`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Recolor API error: ${response.status} - ${errorText}`);
    }

    const recoloredBlob = await response.blob();
    const dataUrl = await blobToDataUrl(recoloredBlob);

    onStatusChange?.('ready');
    return dataUrl;
  } catch (error) {
    console.error('Recolor error:', error);
    onStatusChange?.('error');
    throw error;
  }
}

/**
 * Get the current API URL (useful for debugging)
 */
export function getApiUrl(): string {
  return RECOLOR_API_URL;
}
