export type LoadingStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'error';

export function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16)
  ];
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Check if pixel is likely skin tone
function isSkinTone(r: number, g: number, b: number): boolean {
  const [h, s, l] = rgbToHsl(r, g, b);
  return h >= 0 && h <= 50 && s >= 20 && s <= 70 && l >= 30 && l <= 80;
}

// Check if pixel is likely background (very light/dark or neutral)
function isBackground(r: number, g: number, b: number): boolean {
  const [, s, l] = rgbToHsl(r, g, b);
  return l > 92 || l < 8 || s < 10;
}

// Find dominant color cluster (likely clothing)
function findDominantClothingColor(pixels: Uint8ClampedArray, width: number, height: number): [number, number, number] | null {
  const colorCounts: Map<string, { count: number; r: number; g: number; b: number }> = new Map();
  
  // Sample center region (likely clothing area)
  const startY = Math.floor(height * 0.2);
  const endY = Math.floor(height * 0.8);
  const startX = Math.floor(width * 0.2);
  const endX = Math.floor(width * 0.8);
  
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      
      if (isSkinTone(r, g, b) || isBackground(r, g, b)) continue;
      
      // Quantize to reduce colors
      const qr = Math.floor(r / 32) * 32;
      const qg = Math.floor(g / 32) * 32;
      const qb = Math.floor(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      
      const existing = colorCounts.get(key);
      if (existing) {
        existing.count++;
        existing.r += r; existing.g += g; existing.b += b;
      } else {
        colorCounts.set(key, { count: 1, r, g, b });
      }
    }
  }
  
  let maxCount = 0;
  let dominant: { r: number; g: number; b: number; count: number } | null = null;
  
  colorCounts.forEach((data) => {
    if (data.count > maxCount) {
      maxCount = data.count;
      dominant = data;
    }
  });
  
  if (!dominant || maxCount < 100) return null;
  const d = dominant as { r: number; g: number; b: number; count: number };
  return [
    Math.round(d.r / d.count),
    Math.round(d.g / d.count),
    Math.round(d.b / d.count)
  ];
}

// Calculate color distance
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export async function recolorClothing(
  imageUrl: string,
  targetColor: string,
  onStatusChange?: (status: LoadingStatus) => void
): Promise<string> {
  try {
    onStatusChange?.('processing');
    
    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    
    // Find dominant clothing color
    const dominantColor = findDominantClothingColor(pixels, canvas.width, canvas.height);
    if (!dominantColor) {
      onStatusChange?.('ready');
      return imageUrl; // Return original if no clothing detected
    }
    
    const [domR, domG, domB] = dominantColor;
    const [domH, domS] = rgbToHsl(domR, domG, domB);
    
    // Target color HSL
    const [targetR, targetG, targetB] = hexToRgb(targetColor);
    const [targetH, targetS] = rgbToHsl(targetR, targetG, targetB);
    
    // Hue shift amount
    const hueShift = targetH - domH;
    const satRatio = domS > 0 ? targetS / domS : 1;
    
    // Recolor pixels similar to dominant color
    const threshold = 80; // Color distance threshold
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      
      if (isSkinTone(r, g, b) || isBackground(r, g, b)) continue;
      
      const dist = colorDistance(r, g, b, domR, domG, domB);
      if (dist > threshold) continue;
      
      // Apply color shift based on distance (smoother blending)
      const blend = 1 - (dist / threshold);
      const [h, s, l] = rgbToHsl(r, g, b);
      
      let newH = h + hueShift * blend;
      if (newH < 0) newH += 360;
      if (newH > 360) newH -= 360;
      
      const newS = Math.min(100, s * (1 + (satRatio - 1) * blend));
      const [newR, newG, newB] = hslToRgb(newH, newS, l);
      
      pixels[i] = newR;
      pixels[i + 1] = newG;
      pixels[i + 2] = newB;
    }

    ctx.putImageData(imgData, 0, 0);
    onStatusChange?.('ready');
    
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    console.error('Recolor error:', error);
    onStatusChange?.('error');
    throw error;
  }
}
