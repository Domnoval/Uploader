import slugify from 'slugify';

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string, id?: string): string {
  const base = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  // Add a short ID suffix if provided
  if (id) {
    const shortId = id.slice(-6);
    return `${base}-${shortId}`;
  }

  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(36).slice(-4);
  return `${base}-${timestamp}`;
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[\\/]/).pop() || filename;

  // Replace spaces and special characters
  const sanitized = basename
    .replace(/[^\w\s.-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

  // Ensure it has a proper extension
  if (!sanitized.includes('.')) {
    return `${sanitized}.jpg`;
  }

  return sanitized;
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(
  originalName: string,
  prefix?: string
): string {
  const sanitized = sanitizeFilename(originalName);
  const parts = sanitized.split('.');
  const extension = parts.pop();
  const basename = parts.join('.');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  if (prefix) {
    return `${prefix}-${basename}-${timestamp}-${random}.${extension}`;
  }

  return `${basename}-${timestamp}-${random}.${extension}`;
}