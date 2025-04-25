import { fileExists, getScreenshotPath, saveScreenshot } from './screenshot.js'

import AdblockerPlugin  from 'puppeteer-extra-plugin-adblocker'
import { Cluster } from 'puppeteer-cluster'
import Stealth from 'puppeteer-extra-plugin-stealth'
import { addExtra } from 'puppeteer-extra'
import { takeScreenshot } from './browser.js'
import vanillaPuppeteer from 'puppeteer'

const puppeteer = addExtra(vanillaPuppeteer)
puppeteer.use(Stealth())
// @ts-ignore
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

const clusterOptions = {
  puppeteer,
  concurrency: Cluster.CONCURRENCY_PAGE,
  maxConcurrency: 10,
  timeout: 30000, // Increased timeout for slower pages
  retryLimit: 2, // Add retry for failed attempts
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
  monitor: true, // Enable monitoring
}

export interface ScreenshotResult {
  url: string;
  success: boolean;
  path?: string;
  error?: string;
}

export async function launchCluster(options = clusterOptions) {
  const cluster = await Cluster.launch({...clusterOptions,...options});

  await cluster.task(async ({ page, data: url }) => {
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

export async function closeCluster(cluster: Cluster) {
  await cluster.close();
}

export async function screenshotUrls(cluster: Cluster, urls: string[]): Promise<boolean> {


  try {
    // Queue all URLs and collect results
    for (const url of urls) {
      await cluster.queue(url);
    }
  } catch (error: any) {
    console.error('Error in screenshot queue:', error);
    return false;
  }

  return true;
}

