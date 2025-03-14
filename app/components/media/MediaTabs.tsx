import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  Newspaper,
  Twitter,
  Youtube,
  StickyNote,
} from "lucide-react";
import { MediaGrid } from "./MediaGrid";
import MediaItem from "./MediaItem";
import DailySummaryCard from "./DailySummaryCard";
import NoteComponent from "./Note";
import type { MediaItem as MediaItemType, Note, ContentItem } from "@/types";

interface MediaTabsProps {
  mediaItems: MediaItemType[];
  notes: Note[];
  isAdmin: boolean;
  user: any;
  onEditMedia: (item: MediaItemType) => void;
  onDeleteMedia: (id: string) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  groupContentByDate: (
    mediaItems: MediaItemType[],
    notes: Note[]
  ) => { date: string; items: ContentItem[] }[];
}

export function MediaTabs({
  mediaItems,
  notes,
  isAdmin,
  user,
  onEditMedia,
  onDeleteMedia,
  onEditNote,
  onDeleteNote,
  groupContentByDate,
}: MediaTabsProps) {
  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="mb-2">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="all" className="flex-1 sm:flex-initial">
            <LayoutGrid className="h-4 w-4" />
            <span className="ml-1 text-xs text-muted-foreground">
              ({mediaItems.length + (user ? notes.length : 0)})
            </span>
          </TabsTrigger>
          <TabsTrigger value="article" className="flex-1 sm:flex-initial">
            <Newspaper className="h-4 w-4" />
            <span className="ml-1 text-xs text-muted-foreground">
              ({mediaItems.filter((item) => item.type === "article").length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="tweet" className="flex-1 sm:flex-initial">
            <Twitter className="h-4 w-4" />
            <span className="ml-1 text-xs text-muted-foreground">
              ({mediaItems.filter((item) => item.type === "tweet").length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex-1 sm:flex-initial">
            <Youtube className="h-4 w-4" />
            <span className="ml-1 text-xs text-muted-foreground">
              ({mediaItems.filter((item) => item.type === "youtube").length})
            </span>
          </TabsTrigger>
          {user && (
            <TabsTrigger value="notes" className="flex-1 sm:flex-initial">
              <StickyNote className="h-4 w-4" />
              <span className="ml-1 text-xs text-muted-foreground">
                ({notes.length})
              </span>
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent value="all">
        <div className="space-y-3">
          {groupContentByDate(mediaItems, user ? notes : []).map(
            ({ date, items }) => (
              <DailySummaryCard
                key={date}
                date={date}
                items={items}
                isAdmin={isAdmin}
                onEditNote={onEditNote}
                onDeleteNote={onDeleteNote}
                onEditMedia={onEditMedia}
                onDeleteMedia={onDeleteMedia}
              />
            )
          )}
        </div>
      </TabsContent>

      <TabsContent value="article">
        <div className="space-y-4">
          {mediaItems
            .filter((item) => item.type === "article")
            .map((item) => (
              <MediaItem
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onEdit={onEditMedia}
                onDelete={onDeleteMedia}
              />
            ))}
        </div>
      </TabsContent>

      <TabsContent value="tweet">
        <MediaGrid
          items={mediaItems.filter((item) => item.type === "tweet")}
          onEdit={onEditMedia}
          onDelete={onDeleteMedia}
          onReorder={() => {}}
          isAdmin={isAdmin}
        />
      </TabsContent>

      <TabsContent value="youtube">
        <div className="space-y-4">
          {mediaItems
            .filter((item) => item.type === "youtube")
            .map((item) => (
              <MediaItem
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onEdit={onEditMedia}
                onDelete={onDeleteMedia}
              />
            ))}
        </div>
      </TabsContent>

      <TabsContent value="notes">
        <div className="border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-50/80 dark:bg-gray-800/50 px-4 py-3 border-b dark:border-gray-800">
            <h2 className="text-lg font-medium flex items-center justify-center gap-2">
              <span className="text-gray-800 dark:text-gray-300">🗒️</span>
              <span className="dark:text-gray-200">Notes</span>
            </h2>
          </div>
          <div className="p-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {notes.map((note) => (
              <NoteComponent
                key={note.id}
                note={note}
                isAdmin={isAdmin}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
