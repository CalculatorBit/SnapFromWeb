import { getCachedScreenshotPath, getScreenshotPath, saveScreenshot } from '@/lib/storage';

import { Cluster } from 'puppeteer-cluster';
import type { Page } from 'puppeteer';
import { takeScreenshot } from '@/lib/browser';
import 'dotenv/config'

const {HEADLESS_BROWSER, MAX_CONCURRENCY, PAGE_LOAD_TIMEOUT, RETRY_LIMIT} = process.env;
export interface ScreenshotResult {
  url: string;
  success: boolean;
  path?: string;
  error?: string;
  cached?: boolean;
}

const defaultClusterOptions = {
  // CONCURRENCY_CONTEXT: Single browser, multiple incognito contexts (isolated, shared browser)
  // CONCURRENCY_BROWSER: Multiple browsers (one per worker - uses more resources)
  // CONCURRENCY_PAGE: Single browser, reuses pages (not recommended - shares state)
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: Number(MAX_CONCURRENCY) || 10,
  timeout: Number(PAGE_LOAD_TIMEOUT) || 30000,
  retryLimit: Number(RETRY_LIMIT) || 2,
  monitor: true,
};

const defaultPuppeteerOptions = {
  headless: HEADLESS_BROWSER === 'true' || HEADLESS_BROWSER === '1',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    // '--disable-gpu'
  ]
};

export type ClusterOptions = Partial<typeof defaultClusterOptions>;
export type PuppeteerOptions = Partial<typeof defaultPuppeteerOptions>;

interface LaunchClusterOptions {
  cluster?: ClusterOptions;
  puppeteer?: PuppeteerOptions;
}

// Singleton cluster instance
let clusterInstance: Cluster<string, ScreenshotResult> | null = null;
let clusterInitPromise: Promise<Cluster<string, ScreenshotResult>> | null = null;

/**
 * Screenshot task function - processes a single URL
 */
async function screenshotTask({ page, data: url }: { page: Page; data: string }): Promise<ScreenshotResult> {
  try {
    // Check if screenshot already exists for this hour
    const cachedPath = await getCachedScreenshotPath(url);

    if (cachedPath) {
      return {
        url,
        success: true,
        path: cachedPath,
        cached: true
      };
    }

    // Get the new path (includes current date-hour)
    const outputPath = await getScreenshotPath(url);

    // Configure page
    await page.setViewport({ width: 1920, height: 1080 });
    const response = await page.goto(url, {
      // networkidle2: allows up to 2 active connections (better for sites with analytics/websockets)
      // networkidle0: waits for 0 connections (can hang on active sites)
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: Number(PAGE_LOAD_TIMEOUT) || 30000,
    });

    // Extra wait for any lazy-loaded content or animations to settle
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

    // Check for HTTP errors - don't screenshot error pages
    const status = response?.status() ?? 0;
    if (status >= 400) {
      throw new Error(`HTTP ${status}: Server returned error status`);
    }

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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to screenshot ${url}:`, message);
    return {
      url,
      success: false,
      error: message
    };
  }
}

/**
 * Get or create the singleton cluster instance.
 * Uses a single browser with multiple contexts for isolation.
 */
async function getCluster({
  cluster: clusterOptions = {},
  puppeteer: puppeteerOptions = {},
}: LaunchClusterOptions = {}): Promise<Cluster<string, ScreenshotResult>> {
  // Return existing instance if available
  if (clusterInstance) {
    return clusterInstance;
  }

  // If initialization is in progress, wait for it
  if (clusterInitPromise) {
    return clusterInitPromise;
  }

  // Initialize new cluster (launched once, reused for all requests)
  clusterInitPromise = (async () => {
    const cluster = await Cluster.launch({
      ...defaultClusterOptions,
      ...clusterOptions,
      puppeteerOptions: {
        ...defaultPuppeteerOptions,
        ...puppeteerOptions,
      }
    });

    // Define the task once
    await cluster.task(screenshotTask);

    // Handle errors globally
    cluster.on('taskerror', (err, data) => {
      console.error(`Task error for ${data}:`, err.message);
    });

    clusterInstance = cluster;
    return cluster;
  })();

  return clusterInitPromise;
}

/**
 * Take screenshots of one or more URLs.
 * Uses the singleton cluster - browser stays open between requests.
 */
export async function takeScreenshots(urls: string[]): Promise<ScreenshotResult[]> {
  const cluster = await getCluster();

  // Queue all URLs and wait for results
  const results = await Promise.all(
    urls.map(url => cluster.execute(url))
  );

  return results;
}

/**
 * Take a screenshot of a single URL.
 */
export async function takeScreenshotOfUrl(url: string): Promise<ScreenshotResult> {
  const cluster = await getCluster();
  return cluster.execute(url);
}

/**
 * Close the singleton cluster instance.
 * Call this during graceful shutdown.
 */
export async function closeCluster(): Promise<void> {
  if (clusterInstance) {
    await clusterInstance.idle();
    await clusterInstance.close();
    clusterInstance = null;
    clusterInitPromise = null;
  }
}