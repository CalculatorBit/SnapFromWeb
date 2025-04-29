import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
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

interface DomainGroup {
  domain: string;
  images: GalleryImage[];
}

export function Gallery() {
  const [domainGroups, setDomainGroups] = useState<DomainGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gallery/?page=1&pageSize=100`);
      const result: GalleryResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load images');
      }

      // Group images by domain
      const groupedImages = result.data.images.reduce((acc, image) => {
        const existingGroup = acc.find(group => group.domain === image.domain);
        if (existingGroup) {
          existingGroup.images.push(image);
        } else {
          acc.push({ domain: image.domain, images: [image] });
        }
        return acc;
      }, [] as DomainGroup[]);

      // Sort groups by domain name
      groupedImages.sort((a, b) => a.domain.localeCompare(b.domain));

      // Sort images within each group by timestamp (newest first)
      groupedImages.forEach(group => {
        group.images.sort((a, b) => b.timestamp - a.timestamp);
      });

      setDomainGroups(groupedImages);
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
      <div className="space-y-12">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, imgIndex) => (
                <Skeleton key={`skeleton-img-${imgIndex}`} className="w-full aspect-video" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (domainGroups.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No screenshots found
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {domainGroups.map((group) => (
        <section key={group.domain} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              {group.domain}
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                ({group.images.length} screenshots)
              </span>
            </h2>
            <Button variant="ghost" className="gap-2" asChild>
              <a href={`/gallery/${encodeURIComponent(group.domain)}/`}>
                View all
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.images.slice(0, 3).map((image) => (
              <ScreenshotCard key={image.url} image={image} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}