"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

interface UrlSubmitEvent extends Event {
  detail: string[];
}

export function UrlInput() {
  const [isBulkMode, setIsBulkMode] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    let urls: string[] = [];
    if (isBulkMode) {
      urls = formData.get('urls')?.toString().split('\n').filter(url => url.trim()) || []
    } else {
      const url = formData.get('url')?.toString()
      if (url) {
        urls = [url]
      }
    }

    // Create and dispatch the custom event
    const event = new Event('urlsubmit') as UrlSubmitEvent;
    event.detail = urls;
    document.dispatchEvent(event);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle>Enter Website URL</CardTitle>
            <CardDescription>
              Paste the URL of the website you want to capture
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Bulk Mode</span>
            <Switch
              checked={isBulkMode}
              onCheckedChange={setIsBulkMode}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {!isBulkMode ? (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com"
                name="url"
                required
                className="flex-1"
              />
              <Button type="submit">Capture</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                name="urls"
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter multiple URLs (one per line)"
                required
              />
              <Button type="submit" className="w-full">
                Capture All
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}