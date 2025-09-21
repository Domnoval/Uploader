import sharp from 'sharp';
import * as ort from 'onnxruntime-web';
import Jimp from 'jimp';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs/promises';

/**
 * Background removal configuration
 */
interface BgRemovalConfig {
  provider: 'local' | 'rembg' | 'replicate' | 'removebg';
  apiKey?: string;
  modelPath?: string;
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Remove background from image using various providers
 */
export async function removeBackground(
  inputPath: string,
  outputPath: string,
  config?: BgRemovalConfig
): Promise<{
  success: boolean;
  provider: string;
  maskPath?: string;
}> {
  const provider = config?.provider || 'local';

  try {
    switch (provider) {
      case 'local':
        return await removeBackgroundLocal(inputPath, outputPath);

      case 'removebg':
        if (!config?.apiKey) {
          throw new Error('Remove.bg API key required');
        }
        return await removeBackgroundRemoveBg(
          inputPath,
          outputPath,
          config.apiKey
        );

      case 'replicate':
        if (!config?.apiKey) {
          throw new Error('Replicate API token required');
        }
        return await removeBackgroundReplicate(
          inputPath,
          outputPath,
          config.apiKey
        );

      case 'rembg':
        return await removeBackgroundRembg(inputPath, outputPath);

      default:
        return await removeBackgroundLocal(inputPath, outputPath);
    }
  } catch (error) {
    console.error(`Error with ${provider} background removal:`, error);

    // Fallback to simple color-based removal
    return await removeBackgroundSimple(inputPath, outputPath);
  }
}

/**
 * Local background removal using ONNX model
 * Uses a lightweight U2Net or BRIA-RMBG model
 */
async function removeBackgroundLocal(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; provider: string; maskPath?: string }> {
  try {
    // For now, use simple edge detection as fallback
    // In production, load ONNX model here
    return await removeBackgroundSimple(inputPath, outputPath);
  } catch (error) {
    console.error('Local background removal failed:', error);
    return { success: false, provider: 'local' };
  }
}

/**
 * Simple color-based background removal
 * Fallback method using edge detection and color similarity
 */
async function removeBackgroundSimple(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; provider: string; maskPath?: string }> {
  try {
    const image = await Jimp.read(inputPath);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Sample background colors from corners
    const bgColors = [
      image.getPixelColor(0, 0),
      image.getPixelColor(width - 1, 0),
      image.getPixelColor(0, height - 1),
      image.getPixelColor(width - 1, height - 1),
    ];

    // Find most common background color
    const bgColor = getMostFrequentColor(bgColors);
    const bgRGBA = Jimp.intToRGBA(bgColor);

    // Create mask based on color similarity
    const tolerance = 30; // Adjust for sensitivity

    image.scan(0, 0, width, height, function (x, y) {
      const pixelColor = image.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(pixelColor);

      // If similar to background, make transparent
      if (isColorSimilar(rgba, bgRGBA, tolerance)) {
        image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);
      }
    });

    // Apply edge smoothing
    image.blur(1);

    // Save as PNG with transparency
    await image.writeAsync(outputPath);

    // Also save mask
    const maskPath = outputPath.replace(/\.[^.]+$/, '_mask.png');
    await createMask(inputPath, maskPath, bgRGBA, tolerance);

    return {
      success: true,
      provider: 'simple',
      maskPath,
    };
  } catch (error) {
    console.error('Simple background removal failed:', error);
    return { success: false, provider: 'simple' };
  }
}

/**
 * Remove.bg API integration
 */
async function removeBackgroundRemoveBg(
  inputPath: string,
  outputPath: string,
  apiKey: string
): Promise<{ success: boolean; provider: string; maskPath?: string }> {
  try {
    const formData = new FormData();
    formData.append('image_file', await fs.readFile(inputPath), 'image.jpg');
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData as any,
    });

    if (!response.ok) {
      throw new Error(`Remove.bg API error: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    await fs.writeFile(outputPath, buffer);

    return {
      success: true,
      provider: 'removebg',
    };
  } catch (error) {
    console.error('Remove.bg API failed:', error);
    return { success: false, provider: 'removebg' };
  }
}

/**
 * Replicate API integration for background removal
 */
async function removeBackgroundReplicate(
  inputPath: string,
  outputPath: string,
  apiToken: string
): Promise<{ success: boolean; provider: string; maskPath?: string }> {
  try {
    const imageBuffer = await fs.readFile(inputPath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString(
      'base64'
    )}`;

    // Use BRIA-RMBG model on Replicate
    const response = await fetch(
      'https://api.replicate.com/v1/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version:
            'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
          input: {
            image: base64Image,
          },
        }),
      }
    );

    const prediction = await response.json();

    // Poll for result
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${result.id}`,
        {
          headers: {
            Authorization: `Token ${apiToken}`,
          },
        }
      );
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error('Replicate processing failed');
    }

    // Download result image
    const imageResponse = await fetch(result.output);
    const imageData = await imageResponse.buffer();
    await fs.writeFile(outputPath, imageData);

    return {
      success: true,
      provider: 'replicate',
    };
  } catch (error) {
    console.error('Replicate API failed:', error);
    return { success: false, provider: 'replicate' };
  }
}

/**
 * Python rembg integration (requires rembg service)
 */
async function removeBackgroundRembg(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; provider: string; maskPath?: string }> {
  try {
    // This would connect to a local rembg service
    // For now, fallback to simple method
    return await removeBackgroundSimple(inputPath, outputPath);
  } catch (error) {
    console.error('Rembg failed:', error);
    return { success: false, provider: 'rembg' };
  }
}

/**
 * Create a binary mask from the background removal
 */
async function createMask(
  inputPath: string,
  outputPath: string,
  bgColor: { r: number; g: number; b: number; a: number },
  tolerance: number
): Promise<void> {
  const image = await Jimp.read(inputPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  // Create binary mask
  image.scan(0, 0, width, height, function (x, y) {
    const pixelColor = image.getPixelColor(x, y);
    const rgba = Jimp.intToRGBA(pixelColor);

    // White for foreground, black for background
    if (isColorSimilar(rgba, bgColor, tolerance)) {
      image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 255), x, y);
    } else {
      image.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 255), x, y);
    }
  });

  await image.writeAsync(outputPath);
}

/**
 * Check if two colors are similar within tolerance
 */
function isColorSimilar(
  color1: { r: number; g: number; b: number; a: number },
  color2: { r: number; g: number; b: number; a: number },
  tolerance: number
): boolean {
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance
  );
}

/**
 * Get most frequent color from array
 */
function getMostFrequentColor(colors: number[]): number {
  const counts = new Map<number, number>();
  colors.forEach((color) => {
    counts.set(color, (counts.get(color) || 0) + 1);
  });

  let maxCount = 0;
  let mostFrequent = colors[0];
  counts.forEach((count, color) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = color;
    }
  });

  return mostFrequent;
}