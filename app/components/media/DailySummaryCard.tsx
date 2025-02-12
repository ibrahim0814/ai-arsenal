import { Calendar, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

interface DailySummaryCardProps {
  date: string;
  items: MediaItem[];
}

export default function DailySummaryCard({
  date,
  items,
}: DailySummaryCardProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles"
    });
  };

  const toggleExpand = (id: string) => {
    const newExpandedItems = new Set(expandedItems);
    if (expandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  return (
    <div className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(date)}</span>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="space-y-1.5 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm mb-1 hover:text-blue-600 hover:underline inline-block"
                  >
                    {item.title}
                  </a>
                  {item.description && (
                    <div className="mt-1">
                      <p
                        className={`text-gray-600 text-sm leading-relaxed ${
                          !expandedItems.has(item.id) ? "line-clamp-2" : ""
                        }`}
                      >
                        {item.description}
                      </p>
                      {item.description.split(" ").length > 30 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-gray-500 hover:text-gray-900 px-2 -ml-2"
                          onClick={() => toggleExpand(item.id)}
                        >
                          {expandedItems.has(item.id) ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Read more
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-gray-500 hover:text-gray-900"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
