import type { MediaItem as MediaItemType } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreVertical, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { Tweet } from "react-tweet";
import YouTubeEmbed from "./YouTubeEmbed";
import { formatPacificDateShort, formatPacificTime } from "@/utils/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MediaItemProps {
  item: MediaItemType;
  onEdit?: (item: MediaItemType) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
  hideDate?: boolean;
  showTimeOnly?: boolean;
}

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

const styles = `
.tweet-no-date [data-testid="User-Name"] > div:last-child {
  display: none !important;
}
` as const;

export default function MediaItem({
  item,
  onEdit,
  onDelete,
  isAdmin,
  hideDate = false,
  showTimeOnly = false,
}: MediaItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const formatDate = (dateString: string) => {
    if (showTimeOnly) {
      return formatPacificTime(dateString);
    }
    return formatPacificDateShort(dateString);
  };

  const getTweetId = (url: string): string => {
    return url.split("/").pop()?.split("?")[0] || "";
  };

  const renderTypeLabel = () => {
    switch (item.type) {
      case "article":
        return "Article";
      case "tweet":
        return "X Post";
      case "youtube":
        return "YouTube";
      default:
        return "Other";
    }
  };

  const renderTimeLabel = () => {
    if (hideDate) {
      return renderTypeLabel();
    }
    const time = formatDate(item.created_at);
    if (showTimeOnly) {
      return time;
    }
    return `${renderTypeLabel()} • ${time}`;
  };

  const renderActions = () => (
    <div className="absolute top-2 right-2 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin && onEdit && onDelete && (
            <>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (item.type === "tweet") {
    return (
      <div className="relative w-full border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {isAdmin && renderActions()}
        <div className="p-4">
          <div className="flex justify-center">
            <div className="tweet-no-date">
              <Tweet id={getTweetId(item.url)} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === "youtube") {
    return (
      <div className="relative w-full border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {isAdmin && renderActions()}
        <div className="p-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.title}
              </a>
            </h3>
          </div>
          <div className="w-full">
            {item.videoId ? (
              <YouTubeEmbed videoId={item.videoId} />
            ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <p className="text-muted-foreground">Video not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full border rounded-lg bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {isAdmin && renderActions()}
      <div className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {item.title}
                </a>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                {item.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <time className="text-[0.7rem] font-medium text-muted-foreground tabular-nums">
              {formatDate(item.created_at)}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}
