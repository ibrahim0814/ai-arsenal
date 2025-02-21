import { Tool } from "@/types";
import ToolItem from "./ToolItem";
import { Loader2 } from "lucide-react";

interface ToolsContentProps {
  tools: Tool[];
  searchResults: Tool[];
  isSearching: boolean;
  onSearch: (query: string) => void;
  onEdit: (
    id: string,
    title: string,
    link: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAdmin: boolean;
}

export function ToolsContent({
  tools,
  searchResults,
  isSearching,
  onSearch,
  onEdit,
  onDelete,
  isAdmin,
}: ToolsContentProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2.5">
        {isSearching ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Searching tools...</p>
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((tool) => (
            <ToolItem
              key={tool.id}
              tool={tool}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))
        ) : searchResults.length === 0 && isSearching === false ? (
          tools.map((tool) => (
            <ToolItem
              key={tool.id}
              tool={tool}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No tools found</p>
          </div>
        )}
      </div>
    </div>
  );
}
