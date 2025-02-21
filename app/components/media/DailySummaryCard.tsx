import { Calendar } from "lucide-react";
import Note from "./Note";
import MediaItem from "./MediaItem";
import { toPacificDate } from "@/utils/date";
import type {
  MediaItem as MediaItemType,
  Note as NoteType,
  ContentItem,
} from "@/types";

interface DailySummaryCardProps {
  date: string;
  items: ContentItem[];
  isAdmin?: boolean;
  onEditNote?: (note: NoteType) => void;
  onDeleteNote?: (id: string) => void;
  onEditMedia?: (item: MediaItemType) => void;
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
    const date = toPacificDate(dateString);
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
  const sortedItems = [...items].sort((a, b) => {
    const dateA = toPacificDate(a.created_at);
    const dateB = toPacificDate(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

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
