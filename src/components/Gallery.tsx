"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, LayoutGrid, Layers } from "lucide-react"
import { ScreenshotCard } from "@/components/ScreenshotCard"
import { Skeleton } from "@/components/ui/skeleton"

interface GalleryImage {
  url: string
  originalUrl: string
  domain: string
  timestamp: number
}

interface GalleryResponse {
  success: boolean
  data: {
    images: GalleryImage[]
    total: number
    page: number
    pageSize: number
  }
  error?: string
}

interface DomainGroup {
  domain: string
  images: GalleryImage[]
}

export function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [domainGroups, setDomainGroups] = useState<DomainGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGrouped, setIsGrouped] = useState(false)

  useEffect(() => {
    fetchImages()
  }, [])

  async function fetchImages() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/gallery/?page=1&pageSize=200`)
      const result: GalleryResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load images')
      }

      // Store all images
      const sortedImages = [...result.data.images].sort((a, b) => b.timestamp - a.timestamp)
      setImages(sortedImages)

      // Group images by domain
      const groupedImages = result.data.images.reduce((acc, image) => {
        const existingGroup = acc.find(group => group.domain === image.domain)
        if (existingGroup) {
          existingGroup.images.push(image)
        } else {
          acc.push({ domain: image.domain, images: [image] })
        }
        return acc
      }, [] as DomainGroup[])

      // Sort groups by domain name
      groupedImages.sort((a, b) => a.domain.localeCompare(b.domain))

      // Sort images within each group by timestamp (newest first)
      groupedImages.forEach(group => {
        group.images.sort((a, b) => b.timestamp - a.timestamp)
      })

      setDomainGroups(groupedImages)
    } catch (error) {
      console.error("Failed to fetch images:", error)
      setError(error instanceof Error ? error.message : 'Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
        {error}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-10">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, imgIndex) => (
                <Skeleton key={`skeleton-img-${imgIndex}`} className="w-full aspect-video rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
        <p className="text-muted-foreground">No screenshots found</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Start by capturing some URLs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setIsGrouped(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isGrouped
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            By Domain
          </button>
          <button
            type="button"
            onClick={() => setIsGrouped(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              !isGrouped
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            All
          </button>
        </div>
      </div>

      {/* Grouped View */}
      {isGrouped ? (
        <div className="space-y-10">
          {domainGroups.map((group) => (
            <section key={group.domain} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight">
                  {group.domain}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({group.images.length})
                  </span>
                </h2>
                {group.images.length > 5 && (
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" asChild>
                    <a href={`/gallery/${encodeURIComponent(group.domain)}/`}>
                      View all
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {group.images.slice(0, 5).map((image) => (
                  <ScreenshotCard key={image.url} image={image} showDomain={false} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* All Screenshots View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map((image) => (
            <ScreenshotCard key={image.url} image={image} showDomain={true} />
          ))}
        </div>
      )}
    </div>
  )
}
