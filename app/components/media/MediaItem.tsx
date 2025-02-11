import { Button } from "@/components/ui/button";
import {
  Loader2,
  ExternalLink,
  Newspaper,
  Twitter,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { Tweet } from "react-tweet";
import YouTubeEmbed from "./YouTubeEmbed";

interface MediaItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  type: "article" | "tweet" | "youtube" | "other";
  embedHtml?: string;
  videoId?: string;
  created_at: string;
}

interface MediaItemProps {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export default function MediaItem({
  item,
  onEdit,
  onDelete,
  isAdmin,
}: MediaItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTweetId = (url: string): string => {
    return url.split("/").pop()?.split("?")[0] || "";
  };

  if (item.type === "tweet") {
    return (
      <div className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-center justify-between text-gray-500 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Twitter className="h-5 w-5" />
              <span>X Post • Saved on {formatDate(item.created_at)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(item.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onEdit(item)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Edit"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onDelete(item.id)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <Tweet id={getTweetId(item.url)} />
          </div>
        </div>
      </div>
    );
  }

  if (item.type === "youtube") {
    return (
      <div className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-center justify-between text-gray-500 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              <span>YouTube • Saved on {formatDate(item.created_at)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(item.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onEdit(item)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Edit"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onDelete(item.id)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="aspect-video w-full">
            {item.videoId ? (
              <YouTubeEmbed videoId={item.videoId} />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Video not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              <span>Article • Saved on {formatDate(item.created_at)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(item.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onEdit(item)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Edit"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => onDelete(item.id)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
