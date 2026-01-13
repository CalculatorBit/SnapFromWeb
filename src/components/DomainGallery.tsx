"use client"

import { useEffect, useState } from "react"
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

interface DomainGalleryProps {
  domain: string
}

// Group images by date
interface DateGroup {
  date: string
  images: GalleryImage[]
}

export function DomainGallery({ domain }: DomainGalleryProps) {
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchImages()
  }, [domain])

  async function fetchImages() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/gallery/?page=1&pageSize=200&domain=${encodeURIComponent(domain)}`)
      const result: GalleryResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load images')
      }

      // Sort images by timestamp (newest first)
      const sortedImages = result.data.images.sort((a, b) => b.timestamp - a.timestamp)

      // Group by date
      const groups = sortedImages.reduce((acc, image) => {
        const date = new Date(image.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        const existingGroup = acc.find(g => g.date === date)
        if (existingGroup) {
          existingGroup.images.push(image)
        } else {
          acc.push({ date, images: [image] })
        }
        return acc
      }, [] as DateGroup[])

      setDateGroups(groups)
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
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="space-y-3">
            <Skeleton className="h-5 w-32" />
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

  if (dateGroups.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
        <p className="text-muted-foreground">No screenshots found for {domain}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {dateGroups.map((group) => (
        <section key={group.date} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-medium text-muted-foreground px-2">
              {group.date}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {group.images.map((image) => (
              <ScreenshotCard key={image.url} image={image} showDomain={false} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
