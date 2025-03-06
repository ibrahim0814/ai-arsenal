import { Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, FileText, Newspaper } from "lucide-react";
import { Tool, Prompt, MediaItem, Note, ContentItem } from "@/types";
import { ToolsSearch } from "./tools/ToolsSearch";
import { SkeletonLoader } from "./SkeletonLoader";
import { Skeleton } from "@/components/ui/skeleton";

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
const TabsNav = lazy(() =>
  import("./TabsNav").then((mod) => ({ default: mod.TabsNav }))
);

// Create a new combined component for TabsNav and SearchBar
const TabsHeader = lazy(() => {
  return Promise.resolve({
    default: ({
      tools,
      prompts,
      mediaItems,
      notes,
      user,
      activeTab,
      onSearch,
    }: {
      tools: Tool[];
      prompts: Prompt[];
      mediaItems: MediaItem[];
      notes: Note[];
      user: any;
      activeTab: string;
      onSearch: (query: string) => void;
    }) => (
      <>
        <div className="flex justify-between items-center">
          <TabsNav
            tools={tools}
            prompts={prompts}
            mediaItems={mediaItems}
            notes={notes}
            user={user}
          />
          {activeTab === "tools" && (
            <div className="hidden md:block w-[300px]">
              <ToolsSearch onSearch={onSearch} />
            </div>
          )}
        </div>
        {activeTab === "tools" && (
          <div className="md:hidden mt-1">
            <ToolsSearch onSearch={onSearch} />
          </div>
        )}
      </>
    ),
  });
});

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
  // Determine if we should show skeletons
  const showSkeletons = isLoading;

  // Completely separate loading state from loaded state
  if (showSkeletons) {
    return (
      <div className={`w-full ${user ? "lg:w-[70%]" : ""} mt-2`}>
        {/* Only show loading spinners during skeleton state */}
        {activeTab === "tools" && (
          <SkeletonLoader
            type="tools"
            isLoggedIn={!!user}
            isAuthenticating={true}
          />
        )}

        {activeTab === "prompts" && (
          <SkeletonLoader
            type="prompts"
            isLoggedIn={!!user}
            isAuthenticating={true}
          />
        )}

        {activeTab === "media" && (
          <SkeletonLoader
            type="media"
            isLoggedIn={!!user}
            isAuthenticating={true}
          />
        )}
      </div>
    );
  }

  // Only render tabs and content when fully loaded
  return (
    <div className={`w-full ${user ? "lg:w-[70%]" : ""} mt-2`}>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className="flex flex-col mb-3">
          <Suspense
            fallback={
              <SkeletonLoader type="tabs-header" activeTab={activeTab} />
            }
          >
            <TabsHeader
              tools={tools}
              prompts={prompts}
              mediaItems={mediaItems}
              notes={notes}
              user={user}
              activeTab={activeTab}
              onSearch={onSearch}
            />
          </Suspense>
        </div>

        <TabsContent value="tools">
          <Suspense
            fallback={
              <SkeletonLoader
                type="tools"
                isLoggedIn={!!user}
                isAuthenticating={true}
              />
            }
          >
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
          <Suspense
            fallback={
              <SkeletonLoader
                type="prompts"
                isLoggedIn={!!user}
                isAuthenticating={true}
              />
            }
          >
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
          <Suspense
            fallback={
              <SkeletonLoader
                type="media"
                isLoggedIn={!!user}
                isAuthenticating={true}
              />
            }
          >
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
