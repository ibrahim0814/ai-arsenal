import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableMediaItem } from "./SortableMediaItem";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Newspaper, Twitter, Youtube, LayoutGrid } from "lucide-react";

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

interface MediaGridProps {
  items: MediaItem[];
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  onReorder: (items: MediaItem[]) => void;
  isAdmin: boolean;
}

type FilterType = "all" | "article" | "tweet" | "youtube";

export function MediaGrid({
  items,
  onEdit,
  onDelete,
  onReorder,
  isAdmin,
}: MediaGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  const filteredItems = items.filter(
    (item) => activeFilter === "all" || item.type === activeFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("all")}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          All
        </Button>
        <Button
          variant={activeFilter === "article" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("article")}
        >
          <Newspaper className="h-4 w-4 mr-2" />
          Articles
        </Button>
        <Button
          variant={activeFilter === "tweet" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("tweet")}
        >
          <Twitter className="h-4 w-4 mr-2" />
          Tweets
        </Button>
        <Button
          variant={activeFilter === "youtube" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("youtube")}
        >
          <Youtube className="h-4 w-4 mr-2" />
          YouTube
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredItems} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <SortableMediaItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
