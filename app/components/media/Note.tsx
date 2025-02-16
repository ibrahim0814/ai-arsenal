import { Calendar } from "lucide-react";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface NoteProps {
  note: Note;
}

export default function Note({ note }: NoteProps) {
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
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(note.created_at)}</span>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
      </div>
    </div>
  );
}
