"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageOff } from "lucide-react"
import { ScreenshotCard } from "@/components/ScreenshotCard"

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
  }
}

export function RecentGallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadImages() {
      try {
        const response = await fetch('/api/gallery/?page=1&pageSize=10')
        const data: GalleryResponse = await response.json()

        if (data.success) {
          setImages(data.data.images)
        } else {
          setError('Failed to load images')
        }
      } catch (err) {
        console.error('Failed to load recent screenshots:', err)
        setError('Failed to load images')
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error || images.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
        <ImageOff className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No screenshots captured yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Start by entering a URL above
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {images.map((image, index) => (
        <ScreenshotCard
          key={`${image.domain}-${index}`}
          image={image}
          showDomain={true}
        />
      ))}
    </div>
  )
}
