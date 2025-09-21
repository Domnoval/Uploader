import sharp from 'sharp';
import { extractPalette, rgbToHex, type RGB } from '@/lib/util/color';

/**
 * Extract color palette from image using sharp
 */
export async function extractImagePalette(
  imagePath: string,
  numColors: number = 7
): Promise<{
  palette: string[];
  dominant: string;
}> {
  try {
    // Resize image for faster processing
    const { data, info } = await sharp(imagePath)
      .resize(200, 200, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert buffer to RGB array
    const pixels: RGB[] = [];
    for (let i = 0; i < data.length; i += info.channels) {
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });
    }

    // Extract palette using k-means
    const palette = extractPalette(pixels, numColors);

    // Find dominant color (most frequent in clusters)
    const dominant = findDominantColor(pixels, palette);

    return {
      palette,
      dominant,
    };
  } catch (error) {
    console.error('Error extracting palette:', error);
    // Return default palette on error
    return {
      palette: ['#000000', '#333333', '#666666', '#999999', '#cccccc'],
      dominant: '#666666',
    };
  }
}

/**
 * Find the dominant color from palette
 */
function findDominantColor(pixels: RGB[], palette: string[]): string {
  if (palette.length === 0) return '#000000';

  // Count pixels closest to each palette color
  const counts = new Map<string, number>();
  palette.forEach((color) => counts.set(color, 0));

  pixels.forEach((pixel) => {
    const pixelHex = rgbToHex(pixel);
    let minDist = Infinity;
    let closestColor = palette[0];

    palette.forEach((paletteColor) => {
      // Simple RGB distance (could use CIEDE2000 for better accuracy)
      const dist = colorDistance(pixelHex, paletteColor);
      if (dist < minDist) {
        minDist = dist;
        closestColor = paletteColor;
      }
    });

    counts.set(closestColor, (counts.get(closestColor) || 0) + 1);
  });

  // Find color with highest count
  let maxCount = 0;
  let dominant = palette[0];
  counts.forEach((count, color) => {
    if (count > maxCount) {
      maxCount = count;
      dominant = color;
    }
  });

  return dominant;
}

/**
 * Simple color distance calculation
 */
function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Hex to RGB conversion
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Analyze image colors for style hints
 */
export async function analyzeImageColors(imagePath: string): Promise<{
  brightness: 'dark' | 'medium' | 'light';
  saturation: 'low' | 'medium' | 'high';
  warmth: 'cool' | 'neutral' | 'warm';
  contrast: 'low' | 'medium' | 'high';
}> {
  try {
    const stats = await sharp(imagePath).stats();

    // Calculate average brightness
    const brightness =
      (stats.channels[0].mean +
        stats.channels[1].mean +
        stats.channels[2].mean) /
      3;

    // Calculate saturation from standard deviation
    const saturation =
      (stats.channels[0].stdev +
        stats.channels[1].stdev +
        stats.channels[2].stdev) /
      3;

    // Determine warmth from red/blue channel comparison
    const warmth = stats.channels[0].mean / stats.channels[2].mean;

    return {
      brightness:
        brightness < 85 ? 'dark' : brightness > 170 ? 'light' : 'medium',
      saturation:
        saturation < 30 ? 'low' : saturation > 60 ? 'high' : 'medium',
      warmth: warmth < 0.9 ? 'cool' : warmth > 1.1 ? 'warm' : 'neutral',
      contrast:
        saturation < 40 ? 'low' : saturation > 80 ? 'high' : 'medium',
    };
  } catch (error) {
    console.error('Error analyzing colors:', error);
    return {
      brightness: 'medium',
      saturation: 'medium',
      warmth: 'neutral',
      contrast: 'medium',
    };
  }
}