import { closeBrowser, getBrowser, getPage, takeScreenshot } from '@/browser.ts';

import fs from "fs-extra";
import { hash } from "node:crypto";
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
    const urlHash = hash('sha256', url);
    const hostname = new URL(url).hostname;
    const outputPath = path.join(process.cwd(), 'public','i', hostname, `${urlHash}.png`);
    return outputPath;
}
export async function loadScreenshotFile(filePath: string) {
    return fs.readFile(filePath);
}
