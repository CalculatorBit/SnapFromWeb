import type { APIRoute } from 'astro';
import fs from 'fs-extra';
import path from 'path';

interface GalleryImage {
  url: string;
  originalUrl: string;
  domain: string;
  timestamp: number;
}

interface GalleryResponse {
  success: boolean;
  data: {
    images: GalleryImage[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('pageSize')) || 12;
    const domain = url.searchParams.get('domain');

    const baseDir = path.join(process.cwd(), 'public', 'i');
    let domains = await fs.readdir(baseDir);

    // Filter domains if specified
    if (domain) {
      domains = domains.filter(d => d.includes(domain));
    }

    const allImages: GalleryImage[] = [];

    // Collect all images
    for (const domain of domains) {
      const domainPath = path.join(baseDir, domain);
      const stats = await fs.stat(domainPath);

      if (stats.isDirectory()) {
        const files = await fs.readdir(domainPath);
        const images = files
          .filter(file => file.endsWith('.png'))
          .map(file => {
            const filePath = path.join(domainPath, file);
            const fileStats = fs.statSync(filePath);
            const hash = path.basename(file, '.png');

            return {
              url: `/i/${domain}/${file}`,
              originalUrl: `https://${domain}`,
              domain,
              timestamp: fileStats.mtimeMs
            };
          });

        allImages.push(...images);
      }
    }

    // Sort by timestamp (newest first)
    allImages.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedImages = allImages.slice(start, end);

    const response: GalleryResponse = {
      success: true,
      data: {
        images: paginatedImages,
        total: allImages.length,
        page,
        pageSize
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Gallery error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to load gallery',
        data: { images: [], total: 0, page: 1, pageSize: 12 }
      } as GalleryResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};