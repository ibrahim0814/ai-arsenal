import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditToolModal } from "./EditToolModal";
import { Badge } from "@/components/ui/badge";
import { formatTagLabel } from "@/lib/utils";
import { Tool } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolItemProps {
  tool: Tool;
  onDelete: (id: string) => Promise<void>;
  onEdit: (
    id: string,
    title: string,
    link: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) => Promise<void>;
  isAdmin: boolean;
}

export default function ToolItem({
  tool,
  onDelete,
  onEdit,
  isAdmin,
}: ToolItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    await onDelete(tool.id);
  };

  const renderActions = () => (
    <div className="absolute top-2 right-2 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="w-full border rounded-lg p-4 bg-white relative">
      {isAdmin && renderActions()}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <a
              href={tool.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-lg font-medium"
            >
              {tool.title}
            </a>
            {tool.is_personal_tool && (
              <Badge className="bg-blue-100 text-blue-800 w-fit">
                Current Stack
              </Badge>
            )}
          </div>
          {tool.description && (
            <p className="text-gray-500 mt-1 mb-3 text-sm">
              {tool.description}
            </p>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {tool.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-800"
              >
                {formatTagLabel(tag)}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        toolName={tool.title}
      />
      <EditToolModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={onEdit}
        tool={tool}
      />
    </div>
  );
}
