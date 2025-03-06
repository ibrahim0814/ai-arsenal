import { Suspense, lazy } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tool, Prompt, MediaItem, Note, ContentItem } from "@/types";
import { ToolsSearch } from "./tools/ToolsSearch";
import { SkeletonLoader } from "./SkeletonLoader";

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
  isAuthenticating?: boolean;
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
  isAuthenticating = false,
}: MainContentProps) {
  // Determine if we should show skeletons
  const showSkeletons = isLoading;

  // Completely separate loading state from loaded state
  if (showSkeletons) {
    // If there's no user (logged out) and not authenticating, use full width
    // If there's a user or we're authenticating, use 70% width for large screens
    const widthClass =
      user || isAuthenticating ? "w-full lg:w-[70%]" : "w-full";

    return (
      <div className={`${widthClass} mt-2`}>
        {/* Always show the tabs header skeleton first */}
        <SkeletonLoader type="tabs-header" activeTab={activeTab} />

        {/* Then show the appropriate content skeleton */}
        {activeTab === "tools" && (
          <SkeletonLoader
            type="tools"
            isLoggedIn={!!user}
            isAuthenticating={isAuthenticating}
          />
        )}

        {activeTab === "prompts" && (
          <SkeletonLoader
            type="prompts"
            isLoggedIn={!!user}
            isAuthenticating={isAuthenticating}
          />
        )}

        {activeTab === "media" && (
          <SkeletonLoader
            type="media"
            isLoggedIn={!!user}
            isAuthenticating={isAuthenticating}
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
          <TabsHeader
            tools={tools}
            prompts={prompts}
            mediaItems={mediaItems}
            notes={notes}
            user={user}
            activeTab={activeTab}
            onSearch={onSearch}
          />
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
