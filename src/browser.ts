import puppeteer from "puppeteer";

export async function getBrowser(options: puppeteer.LaunchOptions = {}) {
  const browser = await puppeteer.launch( options );
  return browser;
}

export async function getPage(browser: puppeteer.Browser, url: string) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page;
}

export async function takeScreenshot(page: puppeteer.Page,  options: puppeteer.ScreenshotOptions = {type: 'png',encoding: 'binary'}) {
  const screenshot = await page.screenshot(options);
  return screenshot;
}

export async function closeBrowser(browser: puppeteer.Browser) {
  await browser.close();
}


