import sharp from 'sharp';
import Jimp from 'jimp';

/**
 * Auto-crop image based on alpha channel or color similarity
 */
export async function autoCrop(
  inputPath: string,
  outputPath: string,
  options: {
    tolerance?: number; // Color tolerance for edge detection (0-255)
    padding?: number; // Padding to add around detected bounds (percentage)
  } = {}
): Promise<{
  width: number;
  height: number;
  x: number;
  y: number;
}> {
  const { tolerance = 10, padding = 5 } = options;

  try {
    // Use Jimp for edge detection
    const image = await Jimp.read(inputPath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Find bounding box
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    // Get background color from corners
    const bgColors = [
      image.getPixelColor(0, 0),
      image.getPixelColor(width - 1, 0),
      image.getPixelColor(0, height - 1),
      image.getPixelColor(width - 1, height - 1),
    ];

    // Most common corner color is likely background
    const bgColor = getMostCommonColor(bgColors);
    const bgRGBA = Jimp.intToRGBA(bgColor);

    // Scan for content bounds
    image.scan(0, 0, width, height, function (x, y) {
      const pixelColor = image.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(pixelColor);

      // Check if pixel is different from background
      if (!isColorSimilar(rgba, bgRGBA, tolerance)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    });

    // Calculate crop dimensions with padding
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const paddingX = Math.round((cropWidth * padding) / 100);
    const paddingY = Math.round((cropHeight * padding) / 100);

    // Apply padding and ensure within bounds
    const finalX = Math.max(0, minX - paddingX);
    const finalY = Math.max(0, minY - paddingY);
    const finalWidth = Math.min(width - finalX, cropWidth + 2 * paddingX);
    const finalHeight = Math.min(height - finalY, cropHeight + 2 * paddingY);

    // Crop and save with sharp for better quality
    await sharp(inputPath)
      .extract({
        left: finalX,
        top: finalY,
        width: finalWidth,
        height: finalHeight,
      })
      .toFile(outputPath);

    return {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
    };
  } catch (error) {
    console.error('Error auto-cropping image:', error);
    throw error;
  }
}

/**
 * Generate smart close-up crops focusing on interesting regions
 */
export async function generateCloseups(
  inputPath: string,
  outputDir: string,
  numCrops: number = 3
): Promise<string[]> {
  const crops: string[] = [];

  try {
    const image = await sharp(inputPath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }

    const { width, height } = metadata;

    // Define crop regions (rule of thirds, golden ratio points)
    const cropRegions = [
      // Top-left detail
      {
        left: Math.round(width * 0.1),
        top: Math.round(height * 0.1),
        width: Math.round(width * 0.4),
        height: Math.round(height * 0.4),
      },
      // Center focus
      {
        left: Math.round(width * 0.25),
        top: Math.round(height * 0.25),
        width: Math.round(width * 0.5),
        height: Math.round(height * 0.5),
      },
      // Bottom-right detail
      {
        left: Math.round(width * 0.5),
        top: Math.round(height * 0.5),
        width: Math.round(width * 0.4),
        height: Math.round(height * 0.4),
      },
      // Golden ratio point
      {
        left: Math.round(width * 0.382),
        top: Math.round(height * 0.382),
        width: Math.round(width * 0.3),
        height: Math.round(height * 0.3),
      },
    ];

    // Generate crops
    for (let i = 0; i < Math.min(numCrops, cropRegions.length); i++) {
      const outputPath = `${outputDir}/closeup-${i + 1}.jpg`;

      await sharp(inputPath)
        .extract(cropRegions[i])
        .resize(800, 800, { fit: 'cover' })
        .jpeg({ quality: 95 })
        .toFile(outputPath);

      crops.push(outputPath);
    }

    return crops;
  } catch (error) {
    console.error('Error generating closeups:', error);
    return [];
  }
}

/**
 * Check if two colors are similar within tolerance
 */
function isColorSimilar(
  color1: { r: number; g: number; b: number; a: number },
  color2: { r: number; g: number; b: number; a: number },
  tolerance: number
): boolean {
  // Check alpha channel first
  if (Math.abs(color1.a - color2.a) > tolerance) {
    return false;
  }

  // Check RGB channels
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance
  );
}

/**
 * Get most common color from array
 */
function getMostCommonColor(colors: number[]): number {
  const counts = new Map<number, number>();

  colors.forEach((color) => {
    counts.set(color, (counts.get(color) || 0) + 1);
  });

  let maxCount = 0;
  let mostCommon = colors[0];

  counts.forEach((count, color) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = color;
    }
  });

  return mostCommon;
}

/**
 * Center crop to specific aspect ratio
 */
export async function centerCrop(
  inputPath: string,
  outputPath: string,
  aspectRatio: number = 1
): Promise<void> {
  try {
    const image = await sharp(inputPath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }

    const { width, height } = metadata;
    const currentRatio = width / height;

    let cropWidth = width;
    let cropHeight = height;

    if (currentRatio > aspectRatio) {
      // Image is wider than target ratio
      cropWidth = Math.round(height * aspectRatio);
    } else if (currentRatio < aspectRatio) {
      // Image is taller than target ratio
      cropHeight = Math.round(width / aspectRatio);
    }

    const left = Math.round((width - cropWidth) / 2);
    const top = Math.round((height - cropHeight) / 2);

    await image
      .extract({
        left,
        top,
        width: cropWidth,
        height: cropHeight,
      })
      .toFile(outputPath);
  } catch (error) {
    console.error('Error center cropping:', error);
    throw error;
  }
}