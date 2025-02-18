import { Button } from "@/components/ui/button";
import {
  Loader2,
  ExternalLink,
  Newspaper,
  Twitter,
  Youtube,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { Tweet } from "react-tweet";
import YouTubeEmbed from "./YouTubeEmbed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onEdit?: (item: MediaItem) => void;
  onDelete?: (id: string) => void;
  isAdmin: boolean;
  hideDate?: boolean;
}

export default function MediaItem({
  item,
  onEdit,
  onDelete,
  isAdmin,
  hideDate,
}: MediaItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const renderActions = () => (
    <div className="absolute top-2 right-2 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white"
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
                className="text-red-600"
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
      <div className="relative w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {isAdmin && renderActions()}
        <div className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <Twitter className="h-4 w-4" />
            <span>
              {hideDate ? "X Post" : `X Post • ${formatDate(item.created_at)}`}
            </span>
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
      <div className="relative w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {isAdmin && renderActions()}
        <div className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <Youtube className="h-4 w-4" />
            <span>
              {hideDate
                ? "YouTube"
                : `YouTube • ${formatDate(item.created_at)}`}
            </span>
          </div>
          <div className="aspect-video w-full mb-3">
            {item.videoId ? (
              <YouTubeEmbed videoId={item.videoId} />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Video not available</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-base">{item.title}</h3>
            {item.description && (
              <p className="text-gray-600 text-sm mt-2">{item.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {isAdmin && renderActions()}
      <div className="p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
          <Newspaper className="h-4 w-4" />
          <span>
            {hideDate ? "Article" : `Article • ${formatDate(item.created_at)}`}
          </span>
        </div>
        <div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-lg mb-2 hover:text-blue-600 hover:underline inline-block"
          >
            {item.title}
          </a>
          {item.description && (
            <div className="mt-2">
              <p
                className={`text-gray-600 text-base leading-relaxed ${
                  !isExpanded ? "line-clamp-4" : ""
                }`}
              >
                {item.description}
              </p>
              {item.description.split(" ").length > 50 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-8 text-gray-500 hover:text-gray-900"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  {isExpanded ? "Show less" : "Read more"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
