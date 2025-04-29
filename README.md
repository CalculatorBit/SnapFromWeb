# SnapFromWeb

A web service that captures screenshots of web pages using Puppeteer with stealth mode and ad-blocking capabilities.

## Features

- Single and bulk URL screenshot capture
- Stealth mode to avoid detection
- Ad-blocking for clean screenshots
- Caching of previously captured screenshots
- Concurrent processing using Puppeteer Cluster
- High-quality full-page screenshots

## API Endpoints

### POST /api/screenshot

Captures screenshots of one or more web pages.

#### Request Format

For a single URL:
```json
{
  "url": "https://example.com"
}
```

For multiple URLs:
```json
{
  "urls": [
    "https://example.com",
    "https://example.org"
  ]
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "original": "https://example.com",
        "screenshot": "/i/example.com/hash.png"
      },
      {
        "original": "https://example.org",
        "error": "Failed to load page"
      }
    ]
  }
}
```

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3000
HOST=localhost

# Screenshot Configuration
MAX_CONCURRENT_JOBS=10
SCREENSHOT_TIMEOUT=30000
```

## Technical Details

- Built with Astro and TypeScript
- Uses Puppeteer with stealth plugins for reliable web scraping
- Implements concurrent processing with Puppeteer Cluster
- Includes ad-blocking for cleaner screenshots
- Caches screenshots to avoid redundant captures

```bash
curl -X POST http://localhost:8080/screenshot/batch -H "Content-Type: application/json" -d "{\"urls\": [\"https://example.com\"]}"

```

```bash
curl http://localhost:8080/screenshot?url=https://example.com
```


