import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, FileText, Newspaper } from "lucide-react";
import { ToolsContent } from "./tools/ToolsContent";
import { PromptsContent } from "./prompts/PromptsContent";
import { MediaTabs } from "./media/MediaTabs";
import { Tool } from "@/types/tool";
import { ToolsSearch } from "./tools/ToolsSearch";

interface Prompt {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

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

interface Note {
  id: string;
  content: string;
  created_at: string;
  type: "note";
}

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
  ) => { date: string; items: (MediaItem | Note)[] }[];
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
}: MainContentProps) {
  return (
    <div className={`w-full ${user ? "lg:w-[70%]" : ""} mt-2`}>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between w-full">
            <TabsList className="flex overflow-x-auto">
              <TabsTrigger value="tools" className="min-w-[100px]">
                <Wrench className="h-4 w-4 mr-2" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="prompts" className="min-w-[100px]">
                <FileText className="h-4 w-4 mr-2" />
                Prompts
              </TabsTrigger>
              <TabsTrigger value="media" className="min-w-[100px]">
                <Newspaper className="h-4 w-4 mr-2" />
                Media
              </TabsTrigger>
            </TabsList>
            {activeTab === "tools" && (
              <div className="w-full sm:w-[300px]">
                <ToolsSearch onSearch={onSearch} />
              </div>
            )}
          </div>
        </div>

        <TabsContent value="tools">
          <ToolsContent
            tools={tools}
            searchResults={searchResults}
            isSearching={isSearching}
            onSearch={onSearch}
            onEdit={onEditTool}
            onDelete={onDeleteTool}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="prompts">
          <PromptsContent
            prompts={prompts}
            isAdmin={isAdmin}
            processingIds={processingIds}
            onEdit={onEditPrompt}
            onDelete={onDeletePrompt}
          />
        </TabsContent>

        <TabsContent value="media">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
