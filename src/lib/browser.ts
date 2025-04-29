import type { Browser, LaunchOptions, Page, ScreenshotOptions } from 'puppeteer';

import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import Stealth from 'puppeteer-extra-plugin-stealth';
import { addExtra } from 'puppeteer-extra';
import puppeteer from "puppeteer";

const puppeteerExtra = addExtra(puppeteer);
puppeteerExtra.use(Stealth());
puppeteerExtra.use(AdblockerPlugin({ blockTrackers: true }));
puppeteerExtra.use(AnonymizeUAPlugin());

export async function getBrowser(options: LaunchOptions = {}) {
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ],
    ...options
  });
  return browser;
}

export async function getPage(browser: Browser, url: string) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url, {
    waitUntil: ['domcontentloaded', 'networkidle0'],
    timeout: 25000
  });
  return page;
}

export async function takeScreenshot(page: Page, options: ScreenshotOptions = { type: 'png', encoding: 'binary' }) {
  const screenshot = await page.screenshot(options);
  return screenshot;
}

export async function closeBrowser(browser: Browser) {
  await browser.close();
}