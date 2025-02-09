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

import { Check, ChevronsUpDown, X, Wand2 } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn, formatTagLabel } from "@/lib/utils";
import { TAG_OPTIONS } from "@/lib/constants";
import { Tool } from "@/types/tool";

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

interface TagResponse {
  value: string;
  [key: string]: any;
}

interface TagOption {
  value: string;
  label: string;
  color: string;
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
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isPersonalTool, setIsPersonalTool] = useState(tool.is_personal_tool);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPerplexity, setIsGeneratingPerplexity] = useState(false);

  useEffect(() => {
    setTitle(tool.title);
    setLink(tool.link);
    setDescription(tool.description);
    setSelectedTags(tool.tags || []);
    setIsPersonalTool(tool.is_personal_tool);
    setError(null);

    const standardTags = TAG_OPTIONS.map((tag) => tag.value);
    const customTags = (tool.tags || []).filter(
      (tag: string) => !standardTags.includes(tag)
    );
    setAvailableTags([...standardTags, ...customTags]);
  }, [tool, isOpen]);

  const regenerateAll = async () => {
    if (!link) return;

    setIsGenerating(true);
    setError(null);
    try {
      // Try to fetch webpage content first
      const response = await fetch("/api/fetch-webpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });

      // Whether the fetch succeeds or fails, we'll try OpenAI
      // If fetch succeeds, we'll pass the content. If it fails, we'll just pass the URL
      const webData = response.ok ? await response.json() : null;

      const openaiResponse = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: webData?.title || link,
          metaDescription: webData?.metaDescription || "",
          headings: webData?.headings || "",
          mainContent: webData?.mainContent || "",
          usePerplexity: false,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error("Failed to generate description");
      }

      const openaiData = await openaiResponse.json();
      if (openaiData.error) {
        throw new Error(openaiData.error);
      }

      // Update fields with the OpenAI response
      setTitle(openaiData.name || "");
      setDescription(openaiData.description || "");

      if (openaiData.tags && Array.isArray(openaiData.tags)) {
        const formattedTags = openaiData.tags
          .map((tag: string) => ({
            value: tag.toLowerCase().replace(/\s+/g, "-"),
            label: tag,
            color: "gray",
          }))
          .filter(
            (tag: TagOption) => tag.value && typeof tag.value === "string"
          );

        // Filter out any tags that already exist in TAG_OPTIONS
        const newTags = formattedTags.filter(
          (tag: TagOption) => !TAG_OPTIONS.some((t) => t.value === tag.value)
        );

        // Convert tag objects to strings before setting state
        const availableTagValues = [
          ...TAG_OPTIONS.map((t: TagOption) => t.value),
          ...newTags.map((t: TagOption) => t.value),
        ];
        setAvailableTags(availableTagValues);
        setSelectedTags(formattedTags.map((t: TagOption) => t.value));
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithPerplexity = async () => {
    setIsGeneratingPerplexity(true);
    setError(null);
    try {
      // Add https:// if no protocol is specified
      const urlWithProtocol = link.match(/^https?:\/\//)
        ? link
        : `https://${link}`;

      const response = await fetch("/api/fetch-and-describe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlWithProtocol }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content with Perplexity");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update fields with Perplexity response
      setTitle(data.webpageInfo?.title || data.name || "");
      setDescription(data.generatedInfo?.description || data.description || "");

      const tags = data.generatedInfo?.tags || data.tags;
      if (tags && Array.isArray(tags)) {
        const formattedTags = tags
          .map((tag: any) => {
            // Handle both string tags and object tags
            const tagValue = typeof tag === "string" ? tag : tag.value;
            return {
              value: tagValue.toLowerCase().replace(/\s+/g, "-"),
              label: tagValue,
              color: "gray",
            };
          })
          .filter(
            (tag: TagOption) => tag.value && typeof tag.value === "string"
          );

        // Filter out any tags that already exist in TAG_OPTIONS
        const newTags = formattedTags.filter(
          (tag: TagOption) => !TAG_OPTIONS.some((t) => t.value === tag.value)
        );

        // Convert tag objects to strings before setting state
        const availableTagValues = [
          ...TAG_OPTIONS.map((t: TagOption) => t.value),
          ...newTags.map((t: TagOption) => t.value),
        ];
        setAvailableTags(availableTagValues);
        setSelectedTags(formattedTags.map((t: TagOption) => t.value));
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate content with Perplexity");
    } finally {
      setIsGeneratingPerplexity(false);
    }
  };

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription>
            Edit the details of the AI tool.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* URL Section */}
            <div className="space-y-2">
              <Label htmlFor="link" className="block">
                URL
              </Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full"
                required
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={regenerateAll}
                  disabled={isGenerating || !link}
                  className="flex-1 h-9"
                >
                  <Wand2
                    className={cn(
                      "h-3.5 w-3.5 mr-1.5",
                      isGenerating && "animate-spin"
                    )}
                  />
                  OpenAI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateWithPerplexity}
                  disabled={isGeneratingPerplexity || !link}
                  className="flex-1 h-9"
                >
                  <Wand2
                    className={cn(
                      "h-3.5 w-3.5 mr-1.5",
                      isGeneratingPerplexity && "animate-spin"
                    )}
                  />
                  Perplexity
                </Button>
              </div>
            </div>

            {/* Title and Description Section */}
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tags and Settings */}
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Tags</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedTags.length === 0
                        ? "Select tags..."
                        : `${selectedTags.length} selected`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[200px] p-0"
                    style={{ overflowY: "auto" }}
                  >
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList style={{ maxHeight: "300px" }}>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {availableTags.map((tag) => (
                            <CommandItem
                              key={tag}
                              onSelect={() => {
                                setSelectedTags((prev) =>
                                  prev.includes(tag)
                                    ? prev.filter((t) => t !== tag)
                                    : [...prev, tag]
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTags.includes(tag)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                                {formatTagLabel(tag)}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedTags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-gray-100 text-gray-800 hover:bg-gray-200"
                        onClick={() =>
                          setSelectedTags((prev) =>
                            prev.filter((t) => t !== tag)
                          )
                        }
                      >
                        {formatTagLabel(tag)}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="personal-tool"
                  checked={isPersonalTool}
                  onCheckedChange={setIsPersonalTool}
                />
                <Label htmlFor="personal-tool">Add to Current Stack</Label>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-2 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
