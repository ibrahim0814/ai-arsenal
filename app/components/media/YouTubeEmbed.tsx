import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Youtube, Shield } from "lucide-react";

interface YouTubeEmbedProps {
  videoId: string;
}

export default function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`;

  return (
    <div className="w-full">
      <div className="relative w-full pt-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title="Video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
