import { LoadingSpinner } from "./LoadingSpinner";
import NoteComponent from "./media/Note";
import { Note } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface NotesSidebarProps {
  notes: Note[];
  isAdmin: boolean;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  isLoading?: boolean;
}

function NoteSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Skeleton className="h-[60px] flex-1 rounded-lg" />
      </div>
      <div className="flex items-start gap-2">
        <Skeleton className="h-[80px] flex-1 rounded-lg" />
      </div>
      <div className="flex items-start gap-2">
        <Skeleton className="h-[40px] flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function NotesSidebar({
  notes,
  isAdmin,
  onEditNote,
  onDeleteNote,
  isLoading = false,
}: NotesSidebarProps) {
  return (
    <div className="hidden lg:block lg:w-[30%] lg:sticky lg:top-4 mt-2">
      <div className="border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
        <div className="bg-gray-50/80 dark:bg-gray-800/50 px-4 py-3 border-b dark:border-gray-800">
          <h2 className="text-lg font-medium flex items-center justify-center gap-2">
            <span className="text-gray-800 dark:text-gray-300">🗒️</span>
            <span className="dark:text-gray-200">Notes</span>
          </h2>
        </div>
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {isLoading ? (
            <NoteSkeleton />
          ) : notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No notes yet
            </div>
          ) : (
            notes.map((note) => (
              <NoteComponent
                key={note.id}
                note={note}
                isAdmin={isAdmin}
                onEdit={() => onEditNote(note)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
