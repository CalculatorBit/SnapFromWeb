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

export async function getScreenshotPath(url: string): Promise<string> {
  const urlHash = createHash('sha256').update(url).digest('hex');
  const hostname = new URL(url).hostname;
  const outputPath = path.join(process.cwd(), 'public', 'i', hostname, `${urlHash}.png`);
  return outputPath;
}

export async function getPublicScreenshotUrl(url: string, context: APIContext): Promise<string> {
  const urlHash = createHash('sha256').update(url).digest('hex');
  const hostname = new URL(url).hostname;

  // Ensure path segments are properly formatted
  const pathSegments = [
    'i',
    hostname,
    `${urlHash}.png`
  ].map(segment => encodeURIComponent(segment));

  // Get full base URL from the request
  const protocol = context.request.headers.get('x-forwarded-proto') || 'http';
  const host = context.request.headers.get('host') || 'localhost:3000';

  // Join path segments with forward slashes
  const path = pathSegments.join('/');

  // Construct the full URL
  return `${protocol}://${host}/${path}`;
}

export async function loadScreenshotFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}