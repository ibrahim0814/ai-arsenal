import { Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, FileText, Newspaper } from "lucide-react";
import { Tool, Prompt, MediaItem, Note, ContentItem } from "@/types";
import { ToolsSearch } from "./tools/ToolsSearch";
import { LoadingSpinner } from "./LoadingSpinner";

// Lazy load non-critical components
const ToolsContent = lazy(() =>
  import("./tools/ToolsContent").then((mod) => ({ default: mod.ToolsContent }))
);
const PromptsContent = lazy(() =>
  import("./prompts/PromptsContent").then((mod) => ({
    default: mod.PromptsContent,
  }))
);
const MediaTabs = lazy(() =>
  import("./media/MediaTabs").then((mod) => ({ default: mod.MediaTabs }))
);

interface MainContentProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tools: Tool[];
  prompts: Prompt[];
  mediaItems: MediaItem[];
  notes: Note[];
  searchResults: Tool[];
  isSearching: boolean;
  processingIds: Record<string, boolean>;
  isAdmin: boolean;
  user: any;
  onSearch: (query: string) => void;
  onEditTool: (
    id: string,
    title: string,
    link: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) => Promise<void>;
  onDeleteTool: (id: string) => Promise<void>;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (prompt: Prompt) => void;
  onEditMedia: (item: MediaItem) => void;
  onDeleteMedia: (id: string) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  groupContentByDate: (
    mediaItems: MediaItem[],
    notes: Note[]
  ) => { date: string; items: ContentItem[] }[];
  isLoading?: boolean;
  toolsLoading?: boolean;
  promptsLoading?: boolean;
  mediaLoading?: boolean;
}

export function MainContent({
  activeTab,
  onTabChange,
  tools,
  prompts,
  mediaItems,
  notes,
  searchResults,
  isSearching,
  processingIds,
  isAdmin,
  user,
  onSearch,
  onEditTool,
  onDeleteTool,
  onEditPrompt,
  onDeletePrompt,
  onEditMedia,
  onDeleteMedia,
  onEditNote,
  onDeleteNote,
  groupContentByDate,
  isLoading = false,
  toolsLoading = false,
  promptsLoading = false,
  mediaLoading = false,
}: MainContentProps) {
  // We don't block rendering the tabs UI even if data is loading

  return (
    <div className={`w-full ${user ? "lg:w-[70%]" : ""} mt-2`}>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger
                value="tools"
                className="flex-1 sm:flex-initial min-w-[100px]"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Tools{" "}
                {tools.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({tools.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="prompts"
                className="flex-1 sm:flex-initial min-w-[100px]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Prompts{" "}
                {prompts.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({prompts.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="flex-1 sm:flex-initial min-w-[100px]"
              >
                <Newspaper className="h-4 w-4 mr-2" />
                Media{" "}
                {(mediaItems.length > 0 || (user && notes.length > 0)) && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({mediaItems.length + (user ? notes.length : 0)})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            {activeTab === "tools" && (
              <div className="hidden md:block w-[300px]">
                <ToolsSearch onSearch={onSearch} />
              </div>
            )}
          </div>
          {activeTab === "tools" && (
            <div className="md:hidden">
              <ToolsSearch onSearch={onSearch} />
            </div>
          )}
        </div>

        <TabsContent value="tools">
          <Suspense fallback={
            <div className="min-h-[200px] flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          }>
            <ToolsContent
              tools={tools}
              searchResults={searchResults}
              isSearching={isSearching}
              onSearch={onSearch}
              onEdit={onEditTool}
              onDelete={onDeleteTool}
              isAdmin={isAdmin}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="prompts">
          <Suspense fallback={
            <div className="min-h-[200px] flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          }>
            <PromptsContent
              prompts={prompts}
              isAdmin={isAdmin}
              processingIds={processingIds}
              onEdit={onEditPrompt}
              onDelete={onDeletePrompt}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="media">
          <Suspense fallback={
            <div className="min-h-[200px] flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          }>
            <MediaTabs
              mediaItems={mediaItems}
              notes={notes}
              isAdmin={isAdmin}
              user={user}
              onEditMedia={onEditMedia}
              onDeleteMedia={onDeleteMedia}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
              groupContentByDate={groupContentByDate}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
