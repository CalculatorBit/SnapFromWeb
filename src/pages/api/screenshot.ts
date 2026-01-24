import type { APIRoute } from 'astro';
import { takeScreenshots } from '@/lib/cluster';
import { getPublicScreenshotUrl } from '@/lib/storage';

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

    // Take screenshots using singleton cluster (browser stays open)
    const results = await takeScreenshots(validUrls);

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