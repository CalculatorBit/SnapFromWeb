"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { Camera, Layers } from "lucide-react"

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.match(/^https?:\/\//i)) return trimmed;
  return `https://${trimmed}`;
}

export function UrlInput() {
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus input on mount and mode change
  useEffect(() => {
    if (!isBulkMode && inputRef.current) {
      inputRef.current.focus()
    } else if (isBulkMode && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isBulkMode])

  const submitUrls = (urls: string[]) => {
    if (urls.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const event = new CustomEvent('urlsubmit', { detail: urls });
    document.dispatchEvent(event);
    setTimeout(() => setIsSubmitting(false), 500);
  }

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const normalized = normalizeUrl(inputValue);
    if (!normalized) return;

    submitUrls([normalized]);
    setInputValue('');
  }

  const handleSingleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSingleSubmit(e);
    }
  }

  const handleBulkKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const urls = e.currentTarget.value
        .split('\n')
        .filter(url => url.trim())
        .map(url => normalizeUrl(url))
        .filter(Boolean);

      if (urls.length > 0) {
        submitUrls(urls);
        e.currentTarget.value = '';
      }
    }
  }

  const handleBulkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const urls = formData.get('urls')?.toString()
      .split('\n')
      .filter(url => url.trim())
      .map(url => normalizeUrl(url))
      .filter(Boolean) || [];

    if (urls.length === 0) return;

    submitUrls(urls);
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setIsBulkMode(false)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              !isBulkMode
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="w-4 h-4" />
            Single
          </button>
          <button
            type="button"
            onClick={() => setIsBulkMode(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              isBulkMode
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-4 h-4" />
            Bulk
          </button>
        </div>
      </div>

      {/* Single URL Mode */}
      {!isBulkMode ? (
        <form onSubmit={handleSingleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="example.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleSingleKeyDown}
              className="flex-1 h-12 text-base bg-background/80 border-2 focus:border-primary"
              disabled={isSubmitting}
              autoFocus
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="h-12 px-6"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Enter</kbd> to capture
          </p>
        </form>
      ) : (
        /* Bulk Mode */
        <form onSubmit={handleBulkSubmit} className="space-y-2">
          <textarea
            ref={textareaRef}
            name="urls"
            rows={5}
            className="w-full rounded-lg border-2 bg-background/80 px-4 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none font-mono"
            placeholder="Enter URLs (one per line)&#10;example.com&#10;google.com&#10;github.com"
            onKeyDown={handleBulkKeyDown}
            required
            disabled={isSubmitting}
            autoFocus
          />
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">Enter</kbd> to capture all
            </p>
            <Button type="submit" disabled={isSubmitting}>
              <Layers className="w-4 h-4 mr-2" />
              Capture All
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
