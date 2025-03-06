import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, FileText, Newspaper } from "lucide-react";
import { Tool, Prompt, MediaItem, Note } from "@/types";

interface TabsNavProps {
  tools: Tool[];
  prompts: Prompt[];
  mediaItems: MediaItem[];
  notes: Note[];
  user: any;
}

export function TabsNav({
  tools,
  prompts,
  mediaItems,
  notes,
  user,
}: TabsNavProps) {
  return (
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
  );
}
