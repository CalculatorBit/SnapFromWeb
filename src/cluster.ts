import AdblockerPlugin  from 'puppeteer-extra-plugin-adblocker'
import { Cluster } from 'puppeteer-cluster'
import Stealth from 'puppeteer-extra-plugin-stealth'
import { addExtra } from 'puppeteer-extra'
import vanillaPuppeteer from 'puppeteer'

const puppeteer = addExtra(vanillaPuppeteer)
puppeteer.use(Stealth())
// @ts-ignore
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))


const clusterOptions= {
  puppeteer,
  concurrency: Cluster.CONCURRENCY_BROWSER,
  maxConcurrency: 10,
  timeout: 10000,
  puppeteerOptions: {
    headless: true,
  },
}
export async function launchCluster(options = clusterOptions) {
    const cluster = await Cluster.launch(options);
    /* Add task to cluster */
        await cluster.task(async ({ page, data:url }) => {
            await page.goto(url)
            await page.screenshot()
    })
  return cluster
}

export async function closeCluster(cluster: Cluster) {
  await cluster.close()
}

export async function screenshotQueue(cluster: Cluster, urls: string[]) {
  const queue = await cluster.queue(urls)
  return queue
}

