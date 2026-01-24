import type { APIContext } from "astro";
import { createHash } from "node:crypto";
import fs from "fs-extra";
import path from "node:path";

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.exists(filePath);
}

export async function saveScreenshot(screenshot: Buffer, outputPath: string): Promise<boolean> {
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, screenshot);
  return true;
}

/**
 * Generate a date-based filename for screenshots
 * Format: YYYYMMDD-HH (year, month, day, hour)
 * This allows screenshots to be cached for 1 hour
 */
function getDateHourString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  return `${year}${month}${day}-${hour}`;
}

/**
 * Get the screenshot path for a URL
 * Files are named with URL hash and date-hour for hourly caching
 */
export async function getScreenshotPath(url: string): Promise<string> {
  const urlHash = createHash('sha256').update(url).digest('hex').substring(0, 12);
  const hostname = new URL(url).hostname;
  const dateHour = getDateHourString();
  const outputPath = path.join(process.cwd(), 'public', 'i', hostname, `${urlHash}-${dateHour}.png`);
  return outputPath;
}

/**
 * Check if a valid cached screenshot exists (within the current hour)
 */
export async function getCachedScreenshotPath(url: string): Promise<string | null> {
  const currentPath = await getScreenshotPath(url);
  if (await fileExists(currentPath)) {
    return currentPath;
  }
  return null;
}

export async function getPublicScreenshotUrl(url: string, context: APIContext): Promise<string> {
  const urlHash = createHash('sha256').update(url).digest('hex').substring(0, 12);
  const hostname = new URL(url).hostname;
  const dateHour = getDateHourString();

  // Ensure path segments are properly formatted
  const pathSegments = [
    'i',
    hostname,
    `${urlHash}-${dateHour}.png`
  ].map(segment => encodeURIComponent(segment));

  // Get full base URL from the request
  const protocol = context.request.headers.get('x-forwarded-proto') || 'http';
  const host = context.request.headers.get('host') || 'localhost:3000';

  // Join path segments with forward slashes
  const urlPath = pathSegments.join('/');

  // Construct the full URL
  return `${protocol}://${host}/${urlPath}`;
}

export async function loadScreenshotFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}