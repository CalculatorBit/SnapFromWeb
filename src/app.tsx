import { closeCluster, launchCluster, screenshotUrls } from "@/cluster";
import {
  fileExists,
  getPublicScreenshotUrl,
  getScreenshotPath,
} from "@/screenshot";

import { HomePage } from "@/components/HomePage";
import { Hono } from "hono";
import dotenv from "dotenv";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

dotenv.config();

const app = new Hono()
  .use("*", logger())
  .use("/*", serveStatic({ root: "public" }))
  .use(prettyJSON());

let cluster: Awaited<ReturnType<typeof launchCluster>> | null = null;

app.get("/", (c) => {
  return c.html(<HomePage />);
});

const screenshotSchema = z.object({
  url: z.string().url(),
});

const batchScreenshotSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
});

app.get("/screenshot", zValidator("query", screenshotSchema), async (c) => {
  const { url } = c.req.valid("query");

  // Check if screenshot exists
  const screenshotPath = await getScreenshotPath(url);
  if (await fileExists(screenshotPath)) {
    console.log("Screenshot found for", screenshotPath);
    const publicUrl = await getPublicScreenshotUrl(url, c);

    return c.json({ url: publicUrl });
  }

  // Ensure cluster is initialized
  if (!cluster) {
    cluster = await launchCluster();
  }

  const success = await screenshotUrls(cluster, [url]);

  if (!success) {
    return c.json({ error: "Failed to take screenshot" }, 500);
  }
  const publicUrl = await getPublicScreenshotUrl(url, c);

  /* check if file exists max 4 seconds, do not use blocking code */
  const checkScreenshot = async () => {
    while (!(await fileExists(screenshotPath))) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  await checkScreenshot();

  return c.json({ url: publicUrl });
});

// New endpoint for batch screenshots
app.post(
  "/screenshot/batch",
  zValidator("json", batchScreenshotSchema),
  async (c) => {
    const { urls } = c.req.valid("json");
    const existingUrls = await Promise.all(urls.map(async (url) => {
      const screenshotPath = await getScreenshotPath(url);
      return await fileExists(screenshotPath);
    }));
    const filteredUrls = urls.filter((url, index) => !existingUrls[index]);
    console.log(filteredUrls);
    if (!cluster) {
      cluster = await launchCluster();
    }
    await screenshotUrls(cluster, filteredUrls);
    return c.json({
      urls: await Promise.all(
        urls.map(async (url) => await getPublicScreenshotUrl(url, c)),
      ),
    });
  },
);

const cleanup = async () => {
  if (cluster) {
    console.log("Closing browser cluster...");
    await closeCluster(cluster);
    cluster = null;
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT || 3001),
}, (info) => {
  console.log(info);
});
