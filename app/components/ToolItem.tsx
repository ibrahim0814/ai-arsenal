import { useState } from 'react'
import { Tool } from '../../types/tool'
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from 'lucide-react'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { EditToolModal } from './EditToolModal'

interface ToolItemProps {
  tool: Tool
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, title: string, link: string, description: string) => Promise<void>
  isAdmin: boolean
}

export default function ToolItem({ tool, onDelete, onEdit, isAdmin }: ToolItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleDelete = async () => {
    await onDelete(tool.id)
  }

  return (
    <li className="flex flex-col border p-4 rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <a href={tool.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {tool.title}
        </a>
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
      {tool.description && (
        <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
      )}
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
    </li>
  )
}

