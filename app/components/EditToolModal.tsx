'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tool } from '../../types/tool'

interface EditToolModalProps {
  isOpen: boolean
  onClose: () => void
  onEditTool: (id: string, title: string, link: string, description: string, is_personal_tool: boolean) => Promise<void>
  tool: Tool
}

export function EditToolModal({ isOpen, onClose, onEditTool, tool }: EditToolModalProps) {
  const [title, setTitle] = useState(tool.title)
  const [link, setLink] = useState(tool.link)
  const [description, setDescription] = useState(tool.description)
  const [isPersonalTool, setIsPersonalTool] = useState(tool.is_personal_tool)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title && link) {
      setIsSubmitting(true)
      setError(null)
      try {
        await onEditTool(tool.id, title, link, description, isPersonalTool)
        onClose()
      } catch (error: any) {
        setError(error.message || 'Failed to edit tool. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription>
            Edit the details of the AI tool.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-4">
              <Switch
                id="personal-tool"
                checked={isPersonalTool}
                onCheckedChange={setIsPersonalTool}
              />
              <Label htmlFor="personal-tool">Add to Current Stack</Label>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
