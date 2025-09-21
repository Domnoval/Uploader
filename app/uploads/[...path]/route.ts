import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { stat, readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), 'uploads', ...params.path);

    // Check if file exists and get stats
    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Read the file
    const file = await readFile(filePath);

    // Determine content type based on file extension
    const ext = params.path[params.path.length - 1].split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'tiff':
      case 'tif':
        contentType = 'image/tiff';
        break;
    }

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Not found', { status: 404 });
  }
}