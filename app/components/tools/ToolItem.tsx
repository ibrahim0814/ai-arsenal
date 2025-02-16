import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditToolModal } from "./EditToolModal";
import { Badge } from "@/components/ui/badge";
import { formatTagLabel } from "@/lib/utils";
import { Tool } from "@/types/tool";

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

  return (
    <div className="w-full border rounded-lg p-4 bg-white relative">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
        {isAdmin && (
          <div className="flex sm:flex-col items-center sm:items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditModalOpen(true)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )}
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
