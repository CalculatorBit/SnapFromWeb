"use client"

import { useState } from "react"
import { X, ExternalLink, Download, Maximize2 } from "lucide-react"

interface ScreenshotCardProps {
  image: {
    url: string
    originalUrl: string
    domain: string
    timestamp: number
  }
  showDomain?: boolean
}

export function ScreenshotCard({ image, showDomain = true }: ScreenshotCardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${image.domain}-${new Date(image.timestamp).toISOString().split('T')[0]}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <>
      {/* Card */}
      <div
        className="group rounded-xl border bg-card overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300"
        onClick={() => setIsFullscreen(true)}
      >
        <div className="aspect-video bg-muted relative overflow-hidden">
          <img
            src={image.url}
            alt={`Screenshot of ${image.domain}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Maximize2 className="w-4 h-4" />
              View
            </div>
          </div>
        </div>
        {showDomain && (
          <div className="p-2.5">
            <p className="text-sm font-medium truncate">{image.domain}</p>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <a
              href={image.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Visit website"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download screenshot"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image */}
          <img
            src={image.url}
            alt={`Screenshot of ${image.domain}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Info bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm">
            {image.domain}
          </div>
        </div>
      )}
    </>
  )
}
