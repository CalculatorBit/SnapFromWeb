import { fileExists, getScreenshotPath, loadScreenshotFile, saveScreenshot, screenshot } from '@/screenshot.js';

import type { FC } from 'hono/jsx'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello SnapFromWeb!')
})

const screenshotSchema = z.object({
  url: z.string().url(),
})

app.get('/screenshot', zValidator('query', screenshotSchema), async (c) => {
  const { url } = c.req.valid('query')
  /* check if screenshot exists */
  const screenshotPath = await getScreenshotPath(url)

  if (await fileExists(screenshotPath)) {
    return c.body(await loadScreenshotFile(screenshotPath))
  }
  const pageScreenshot = await screenshot(url)
  if (!pageScreenshot) {
    return c.json({ error: 'Failed to take screenshot' }, 500)
  }
  await saveScreenshot(Buffer.from(pageScreenshot), screenshotPath)
  return c.body(pageScreenshot)
})

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
