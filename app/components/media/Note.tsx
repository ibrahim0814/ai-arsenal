import { Calendar, Trash2, Edit, StickyNote, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
  id: string;
  content: string;
  created_at: string;
  type: "note";
}

interface NoteProps {
  note: Note;
  onDelete?: (id: string) => void;
  onEdit?: (note: Note) => void;
  isAdmin?: boolean;
  hideDate?: boolean;
}

export default function Note({
  note,
  onDelete,
  onEdit,
  isAdmin,
  hideDate,
}: NoteProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZone: "America/Los_Angeles",
    });
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
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => onEdit?.(note)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete?.(note.id)}
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="relative w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {isAdmin && renderActions()}
      <div className="p-4">
        <div className="flex items-center gap-4 text-gray-500 text-xs mb-3">
          <div className="flex items-center gap-1.5">
            {hideDate ? (
              <>
                <StickyNote className="h-3 w-3" />
                <span>Quick Note</span>
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(note.created_at)}</span>
              </>
            )}
          </div>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
      </div>
    </div>
  );
}
