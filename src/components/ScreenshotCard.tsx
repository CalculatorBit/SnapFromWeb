import { Badge } from "./ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";

interface ScreenshotCardProps {
  image: {
    url: string;
    originalUrl: string;
    domain: string;
    timestamp: number;
  };
}

export function ScreenshotCard({ image }: ScreenshotCardProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${image.domain}-${new Date(image.timestamp).toISOString()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Card className="overflow-hidden group relative">
      <a href={image.originalUrl} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={image.url}
          alt={`Screenshot of ${image.domain}`}
          className="w-full h-auto aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </a>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium truncate flex-1">{image.domain}</p>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={handleDownload}
            title="Download screenshot"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download screenshot</span>
          </Button>
        </div>
        <Badge className="text-xs" title={new Date(image.timestamp).toLocaleString()}>
          {new Date(image.timestamp).toDateString()}
        </Badge>
      </div>
    </Card>
  );
}