import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MediaItem from "./MediaItem";

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

interface SortableMediaItemProps {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export function SortableMediaItem({
  item,
  onEdit,
  onDelete,
  isAdmin,
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MediaItem
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        isAdmin={isAdmin}
      />
    </div>
  );
}
