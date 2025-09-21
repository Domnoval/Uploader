import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { generateUniqueFilename } from '@/lib/util/slug';
import sharp from 'sharp';
import exifr from 'exifr';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          results.push({
            filename: file.name,
            error: 'Invalid file type. Only images are allowed.',
          });
          continue;
        }

        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          results.push({
            filename: file.name,
            error: 'File too large. Maximum size is 50MB.',
          });
          continue;
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const uniqueFilename = generateUniqueFilename(file.name, 'upload');
        const uploadPath = join(process.cwd(), 'uploads', uniqueFilename);

        // Read EXIF data
        let exifData = null;
        try {
          exifData = await exifr.parse(buffer);
        } catch (error) {
          console.log('No EXIF data found:', error);
        }

        // Auto-rotate image based on EXIF orientation
        let processedBuffer = buffer;
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();

          // Apply EXIF rotation
          if (metadata.orientation && metadata.orientation > 1) {
            processedBuffer = await image.rotate().toBuffer();
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }

        // Save original file
        await writeFile(uploadPath, processedBuffer);

        // Generate thumbnail
        const thumbnailFilename = uniqueFilename.replace(/\.[^.]+$/, '_thumb.jpg');
        const thumbnailPath = join(process.cwd(), 'uploads', thumbnailFilename);

        try {
          await sharp(processedBuffer)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath);
        } catch (error) {
          console.error('Error creating thumbnail:', error);
        }

        // Get image dimensions
        let dimensions = { width: 0, height: 0 };
        try {
          const metadata = await sharp(processedBuffer).metadata();
          dimensions = {
            width: metadata.width || 0,
            height: metadata.height || 0,
          };
        } catch (error) {
          console.error('Error reading image metadata:', error);
        }

        results.push({
          filename: file.name,
          uniqueFilename,
          thumbnailFilename,
          size: file.size,
          type: file.type,
          dimensions,
          exifData: exifData ? {
            make: exifData.Make,
            model: exifData.Model,
            dateTime: exifData.DateTime,
            orientation: exifData.Orientation,
          } : null,
          uploadPath: `/uploads/${uniqueFilename}`,
          thumbnailPath: `/uploads/${thumbnailFilename}`,
          success: true,
        });

      } catch (error) {
        console.error('Error processing file:', file.name, error);
        results.push({
          filename: file.name,
          error: 'Failed to process file',
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: results,
      message: `Processed ${results.length} file(s)`,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload endpoint ready',
    maxSize: '50MB',
    supportedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'],
  });
}