/**
 * Color utility functions for palette extraction and harmony
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert RGB to Hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16).padStart(2, '0');
    return hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert Hex to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Calculate CIEDE2000 color difference
 * Lower values = more similar colors
 */
export function ciede2000(rgb1: RGB, rgb2: RGB): number {
  // Simplified CIEDE2000 implementation
  // For production, use a full implementation
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Get color harmony suggestions
 */
export function getColorHarmony(baseColor: string): {
  complementary: string;
  analogous: [string, string];
  triadic: [string, string];
  splitComplementary: [string, string];
} {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);

  // Complementary (opposite on color wheel)
  const complementaryHsl = { ...hsl, h: (hsl.h + 180) % 360 };

  // Analogous (adjacent colors)
  const analogous1 = { ...hsl, h: (hsl.h + 30) % 360 };
  const analogous2 = { ...hsl, h: (hsl.h - 30 + 360) % 360 };

  // Triadic (120 degrees apart)
  const triadic1 = { ...hsl, h: (hsl.h + 120) % 360 };
  const triadic2 = { ...hsl, h: (hsl.h + 240) % 360 };

  // Split-complementary
  const split1 = { ...hsl, h: (hsl.h + 150) % 360 };
  const split2 = { ...hsl, h: (hsl.h + 210) % 360 };

  return {
    complementary: rgbToHex(hslToRgb(complementaryHsl)),
    analogous: [
      rgbToHex(hslToRgb(analogous1)),
      rgbToHex(hslToRgb(analogous2)),
    ],
    triadic: [rgbToHex(hslToRgb(triadic1)), rgbToHex(hslToRgb(triadic2))],
    splitComplementary: [
      rgbToHex(hslToRgb(split1)),
      rgbToHex(hslToRgb(split2)),
    ],
  };
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const getLuminance = (rgb: RGB) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Adjust color brightness
 */
export function adjustBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Get color name from hex
 */
export function getColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  // Basic color naming based on hue
  if (hsl.s < 10) {
    if (hsl.l < 20) return 'black';
    if (hsl.l > 80) return 'white';
    return 'gray';
  }

  const hue = hsl.h;
  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 200) return 'cyan';
  if (hue < 260) return 'blue';
  if (hue < 290) return 'purple';
  if (hue < 345) return 'magenta';

  return 'unknown';
}

/**
 * K-means clustering for palette extraction
 */
export function extractPalette(
  pixels: RGB[],
  numColors: number = 5
): string[] {
  if (pixels.length === 0) return [];

  // Initialize centroids randomly
  const centroids: RGB[] = [];
  const usedIndices = new Set<number>();

  while (centroids.length < Math.min(numColors, pixels.length)) {
    const idx = Math.floor(Math.random() * pixels.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      centroids.push(pixels[idx]);
    }
  }

  // K-means iterations
  for (let iter = 0; iter < 10; iter++) {
    const clusters: RGB[][] = centroids.map(() => []);

    // Assign pixels to nearest centroid
    pixels.forEach((pixel) => {
      let minDist = Infinity;
      let nearestIdx = 0;

      centroids.forEach((centroid, idx) => {
        const dist = ciede2000(pixel, centroid);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = idx;
        }
      });

      clusters[nearestIdx].push(pixel);
    });

    // Update centroids
    centroids.forEach((_, idx) => {
      const cluster = clusters[idx];
      if (cluster.length > 0) {
        const avg = cluster.reduce(
          (acc, pixel) => ({
            r: acc.r + pixel.r / cluster.length,
            g: acc.g + pixel.g / cluster.length,
            b: acc.b + pixel.b / cluster.length,
          }),
          { r: 0, g: 0, b: 0 }
        );
        centroids[idx] = {
          r: Math.round(avg.r),
          g: Math.round(avg.g),
          b: Math.round(avg.b),
        };
      }
    });
  }

  // Sort by luminance
  centroids.sort((a, b) => {
    const lumA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
    const lumB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
    return lumB - lumA;
  });

  return centroids.map(rgbToHex);
}