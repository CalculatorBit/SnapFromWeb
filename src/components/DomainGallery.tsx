import { useEffect, useState } from "react";

import { ScreenshotCard } from "@/components/ScreenshotCard";
import { Skeleton } from "@/components/ui/skeleton";

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

interface DomainGalleryProps {
  domain: string;
}

export function DomainGallery({ domain }: DomainGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, [domain]);

  async function fetchImages() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gallery/?page=1&pageSize=100&domain=${encodeURIComponent(domain)}`);
      const result: GalleryResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load images');
      }

      // Sort images by timestamp (newest first)
      const sortedImages = result.data.images.sort((a, b) => b.timestamp - a.timestamp);
      setImages(sortedImages);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setError(error instanceof Error ? error.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 rounded-md bg-red-50">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`skeleton-${index}`} className="w-full aspect-video" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No screenshots found for {domain}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <ScreenshotCard key={image.url} image={image} />
      ))}
    </div>
  );
}