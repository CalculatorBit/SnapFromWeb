import { closeBrowser, getBrowser, getPage, takeScreenshot } from '@/browser.js';

import type { Context } from 'hono';
import { createHash } from "node:crypto";
import fs from "fs-extra";
import path from "node:path";

export async function screenshot(url: string) {
    const browser = await getBrowser({ headless: true })
    try {
        const page = await getPage(browser, url)
        const screenshot = await takeScreenshot(page)
        await closeBrowser(browser)
        return screenshot
    } catch (e:any) {
        await closeBrowser(browser)
        console.error(e.message)
        return null
    }
}

export async function fileExists(filePath: string) {
  return fs.exists(filePath);
}

export async function saveScreenshot(screenshot: Buffer, outputPath: string) {
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, screenshot);
    return true;
}

export async function getScreenshotPath(url: string) {
    const urlHash = createHash('sha256').update(url).digest('hex');
    const hostname = new URL(url).hostname;
    const outputPath = path.join(process.cwd(), 'public','i', hostname, `${urlHash}.png`);
    return outputPath;
}
export async function getPublicScreenshotUrl(url: string, c: Context) {
    const urlHash = createHash('sha256').update(url).digest('hex');
    const hostname = new URL(url).hostname;

    // Ensure path segments are properly formatted
    const pathSegments = [
        'i',
        hostname,
        `${urlHash}.png`
    ].map(segment => encodeURIComponent(segment));

    // Get full base URL from the request
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const host = c.req.header('host') || 'localhost:3001';

    // Join path segments with forward slashes
    const path = pathSegments.join('/');

    // Construct the full URL
    const publicUrl = `${protocol}://${host}/${path}`;

    return publicUrl;
}
export async function loadScreenshotFile(filePath: string) {
    return fs.readFile(filePath);
}
