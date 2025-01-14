import { useState } from 'react'
import { Tool } from '../../types/tool'
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from 'lucide-react'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { EditToolModal } from './EditToolModal'

interface ToolItemProps {
  tool: Tool
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, title: string, link: string, description: string, is_personal_tool: boolean) => Promise<void>
  isAdmin: boolean
}

export default function ToolItem({ tool, onDelete, onEdit, isAdmin }: ToolItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleDelete = async () => {
    await onDelete(tool.id)
  }

  return (
    <div className="w-full border rounded-lg p-4 mb-4 bg-white relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <a 
            href={tool.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline text-lg"
          >
            {tool.title}
          </a>
          {tool.description && (
            <p className="text-gray-500 mt-1 text-sm">{tool.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {tool.is_personal_tool && (
            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Current Stack
            </div>
          )}
          {isAdmin && (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(true)} className="text-blue-500 hover:text-blue-700">
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          )}
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
        onEditTool={onEdit}
        tool={tool}
      />
    </div>
  )
}
