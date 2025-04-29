import { fileExists, getScreenshotPath, saveScreenshot } from './screenshot';

import { Cluster } from 'puppeteer-cluster';
import type { Page } from 'puppeteer';
import { takeScreenshot } from './browser';

export interface ScreenshotResult {
  url: string;
  success: boolean;
  path?: string;
  error?: string;
  cached?: boolean;
}

const clusterOptions = {
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: 10,
  timeout: 30000,
  retryLimit: 2,
  puppeteerOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  },
  monitor: true,
};

export async function launchCluster(options = {}) {
  const cluster = await Cluster.launch({
    ...clusterOptions,
    ...options
  });

  await cluster.task(async ({ page, data: url }: { page: Page; data: string }) => {
    try {
      // Check if screenshot already exists
      const outputPath = await getScreenshotPath(url);
      const exists = await fileExists(outputPath);

      if (exists) {
        return {
          url,
          success: true,
          path: outputPath,
          cached: true
        };
      }

      // Configure page
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 25000
      });

      // Take and save screenshot
      const screenshot = await takeScreenshot(page);
      if (!(screenshot instanceof Buffer)) {
        throw new Error('Screenshot must be a Buffer');
      }
      await saveScreenshot(screenshot, outputPath);

      return {
        url,
        success: true,
        path: outputPath
      };

    } catch (error: any) {
      console.error(`Failed to screenshot ${url}:`, error.message);
      return {
        url,
        success: false,
        error: error.message
      };
    }
  });

  return cluster;
}