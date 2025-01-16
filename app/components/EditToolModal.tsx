"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tool } from "../../types/tool";
import { MultiSelect } from "@/components/ui/multi-select";
import { TAG_OPTIONS } from "@/lib/constants";

interface EditToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (
    id: string,
    title: string,
    link: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) => Promise<void>;
  tool: Tool;
}

export function EditToolModal({
  isOpen,
  onClose,
  onEdit,
  tool,
}: EditToolModalProps) {
  const [title, setTitle] = useState(tool.title);
  const [link, setLink] = useState(tool.link);
  const [description, setDescription] = useState(tool.description);
  const [selectedTags, setSelectedTags] = useState<string[]>(tool.tags || []);
  const [isPersonalTool, setIsPersonalTool] = useState(tool.is_personal_tool);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(tool.title);
    setLink(tool.link);
    setDescription(tool.description);
    setSelectedTags(tool.tags || []);
    setIsPersonalTool(tool.is_personal_tool);
    setError(null);
  }, [tool, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onEdit(
        tool.id,
        title,
        link,
        description,
        selectedTags,
        isPersonalTool
      );
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <div className="col-span-3">
                <MultiSelect
                  selected={selectedTags}
                  setSelected={setSelectedTags}
                  options={TAG_OPTIONS}
                  placeholder="Select tags..."
                />
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
