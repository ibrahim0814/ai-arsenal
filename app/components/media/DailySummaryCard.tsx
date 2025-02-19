import { Calendar } from "lucide-react";
import Note from "./Note";
import MediaItem from "./MediaItem";
import { formatPacificDateVeryShort, toPacificDate } from "@/utils/date";

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
    const date = new Date(dateString);
    // Add 8 hours to match Pacific time
    date.setHours(date.getHours() + 8);
    const weekday = date.toLocaleString("en-US", { weekday: "short" });
    const monthDay = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${weekday} ${monthDay}`;
  };

  // Convert dates to Pacific timezone for comparison
  const getPacificDate = (dateString: string) => {
    const date = toPacificDate(dateString);
    return date.setHours(0, 0, 0, 0); // normalize to start of day
  };

  // Sort items by creation time
  const sortedItems = [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Filter items to only show those matching the card's date
  const cardDate = getPacificDate(date);
  const filteredItems = sortedItems.filter(
    (item) => getPacificDate(item.created_at) === cardDate
  );

  return (
    <div className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(date)}</span>
        </div>

        <div className="space-y-3">
          {filteredItems.map((item) => (
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
