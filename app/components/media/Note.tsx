import { Calendar, Trash2, Edit, StickyNote, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPacificDateTime, formatPacificTime } from "@/utils/date";
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
  showTimeOnly?: boolean;
}

export default function Note({
  note,
  onDelete,
  onEdit,
  isAdmin,
  hideDate,
  showTimeOnly,
}: NoteProps) {
  const formatDate = (dateString: string) => {
    if (showTimeOnly) {
      return formatPacificTime(dateString);
    }
    return formatPacificDateTime(dateString);
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
        <p className="text-gray-800 whitespace-pre-wrap pr-8">{note.content}</p>
      </div>
    </div>
  );
}
