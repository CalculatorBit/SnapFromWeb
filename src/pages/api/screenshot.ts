import type { APIRoute, APIContext } from 'astro';
import { launchCluster, type ScreenshotResult } from '@/lib/cluster';
import { getPublicScreenshotUrl } from '@/lib/screenshot';

interface ScreenshotResponse {
  success: boolean;
  data: {
    urls: {
      original: string;
      screenshot?: string;
      error?: string;
    }[];
  };
  error?: string;
}

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const urls = Array.isArray(body.urls) ? body.urls : [body.url];

    // Validate URLs
    const validUrls = urls
      .filter(Boolean)
      .map((url: string) => url.trim())
      .filter((url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

    if (validUrls.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid URLs provided',
          data: { urls: [] }
        } as ScreenshotResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize cluster
    const cluster = await launchCluster();
    const results: ScreenshotResult[] = [];

    // Queue tasks and collect results
    try {
      for (const url of validUrls) {
        const result = await cluster.execute(url);
        results.push(result as ScreenshotResult);
      }
    } finally {
      await cluster.close();
    }

    // Format response
    const formattedUrls = await Promise.all(
      results.map(async (result) => {
        const base = { original: result.url };
        if (result.success && result.path) {
          const publicUrl = await getPublicScreenshotUrl(result.url, context);
          return { ...base, screenshot: publicUrl };
        }
        return { ...base, error: result.error };
      })
    );

    const response: ScreenshotResponse = {
      success: true,
      data: {
        urls: formattedUrls
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Screenshot generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        data: { urls: [] }
      } as ScreenshotResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};