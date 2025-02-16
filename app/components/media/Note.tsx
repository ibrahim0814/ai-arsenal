import { Calendar, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface NoteProps {
  note: Note;
  onDelete?: (id: string) => void;
  onEdit?: (note: Note) => void;
  isAdmin?: boolean;
}

export default function Note({ note, onDelete, onEdit, isAdmin }: NoteProps) {
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

  return (
    <div className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-4 text-gray-500 text-xs mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(note.created_at)}</span>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(note)}
                className="text-blue-500 hover:text-blue-700 -my-2 h-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(note.id)}
                className="text-red-500 hover:text-red-700 -my-2 h-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
      </div>
    </div>
  );
}
