import { Calendar, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note as NoteType } from "@/types";

interface NoteProps {
  note: NoteType;
  onDelete?: (id: string) => void;
  onEdit?: (note: NoteType) => void;
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
    const date = new Date(dateString);
    // Add 8 hours
    date.setHours(date.getHours() + 8);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
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
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => onEdit?.(note)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
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
    <div className="relative w-full border border-border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04)] transition-all duration-200 overflow-hidden group">
      {isAdmin && renderActions()}
      <div className="p-3.5">
        <div className="flex items-start gap-2">
          <span className="text-muted-foreground mt-1 font-mono text-sm select-none">
            ‣
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-[0.925rem] leading-relaxed font-normal whitespace-pre-wrap pr-8">
              {note.content}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <time className="text-[0.7rem] font-medium text-muted-foreground tabular-nums">
                {formatDate(note.created_at)}
              </time>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
