import { Calendar, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Note from "./Note";
import MediaItem from "./MediaItem";
import { formatPacificDateVeryShort, formatPacificTime } from "@/utils/date";

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

interface Note {
  id: string;
  content: string;
  created_at: string;
  type: "note";
}

type ContentItem = MediaItem | Note;

interface DailySummaryCardProps {
  date: string;
  items: ContentItem[];
  isAdmin?: boolean;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (id: string) => void;
  onEditMedia?: (item: MediaItem) => void;
  onDeleteMedia?: (id: string) => void;
}

export default function DailySummaryCard({
  date,
  items,
  isAdmin = false,
  onEditNote,
  onDeleteNote,
  onEditMedia,
  onDeleteMedia,
}: DailySummaryCardProps) {
  const formatDate = (dateString: string) => {
    return formatPacificDateVeryShort(dateString);
  };

  // Sort items by creation time
  const sortedItems = [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(date)}</span>
        </div>

        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div key={item.id} className="relative">
              {item.type === "note" ? (
                <Note
                  note={item}
                  isAdmin={isAdmin}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                  showTimeOnly={true}
                />
              ) : (
                <MediaItem
                  item={item}
                  isAdmin={isAdmin}
                  onEdit={onEditMedia}
                  onDelete={onDeleteMedia}
                  showTimeOnly={true}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
