import Note from "./media/Note";

interface Note {
  id: string;
  content: string;
  created_at: string;
  type: "note";
}

interface NotesSidebarProps {
  notes: Note[];
  isAdmin: boolean;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesSidebar({
  notes,
  isAdmin,
  onEditNote,
  onDeleteNote,
}: NotesSidebarProps) {
  return (
    <div className="hidden lg:block lg:w-[30%] lg:sticky lg:top-4 mt-6">
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="bg-gray-50/80 px-4 py-3 border-b">
          <h2 className="text-lg font-medium flex items-center justify-center gap-2">
            <span className="text-gray-800">🗒️</span>
            <span>Notes</span>
          </h2>
        </div>
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {notes.map((note) => (
            <Note
              key={note.id}
              note={note}
              isAdmin={isAdmin}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
