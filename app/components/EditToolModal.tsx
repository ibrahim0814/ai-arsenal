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

  useEffect(() => {
    setTitle(tool.title);
    setLink(tool.link);
    setDescription(tool.description);
    setSelectedTags(tool.tags || []);
    setIsPersonalTool(tool.is_personal_tool);
    setError(null);

    // Combine TAG_OPTIONS with any custom tags from the tool
    const standardTags = TAG_OPTIONS.map((tag) => tag.value);
    const customTags = (tool.tags || []).filter(
      (tag) => !standardTags.includes(tag)
    );
    setAvailableTags([...standardTags, ...customTags]);
  }, [tool, isOpen]);

  const regenerateAll = async () => {
    if (!link) return;

    setIsGenerating(true);
    setError(null);
    try {
      // First attempt with Cheerio + OpenAI
      const response = await fetch("/api/fetch-webpage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: link }),
      });

      const data = await response.json();

      // Check if we should retry with Perplexity
      if (response.status === 422 && data.shouldRetryWithPerplexity) {
        console.log("Retrying with Perplexity API...");
        const perplexityResponse = await fetch("/api/generate-description", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: link,
            metaDescription: "",
            headings: "",
            mainContent: "",
            usePerplexity: true,
          }),
        });

        if (!perplexityResponse.ok) {
          throw new Error("Failed to generate content with Perplexity");
        }

        const perplexityData = await perplexityResponse.json();
        if (perplexityData.error) {
          throw new Error(perplexityData.error);
        }

        // Update fields with Perplexity response
        setTitle(perplexityData.name || "");
        setDescription(perplexityData.description || "");

        if (perplexityData.tags && Array.isArray(perplexityData.tags)) {
          const standardTags = TAG_OPTIONS.map((tag) => tag.value);

          interface FormattedTag {
            value: string;
            label: string;
            color: string;
          }

          const formattedTags = perplexityData.tags
            .map(
              (tag: string) =>
                ({
                  value: tag.toLowerCase().replace(/\s+/g, "-"),
                  label: tag,
                  color: "gray",
                } as FormattedTag)
            )
            .filter(
              (tag: FormattedTag) => tag.value && typeof tag.value === "string"
            );

          // Filter out any tags that already exist in TAG_OPTIONS
          const newTags = formattedTags.filter(
            (tag: FormattedTag) =>
              !TAG_OPTIONS.some((t) => t.value === tag.value)
          );

          setAvailableTags([
            ...standardTags,
            ...formattedTags.map((t: FormattedTag) => t.value),
          ]);
          setSelectedTags(formattedTags.map((t: FormattedTag) => t.value));
        }
        return;
      }

      // If not retrying with Perplexity, handle the original response
      if (!response.ok) {
        throw new Error("Failed to fetch webpage");
      }

      // Get description from OpenAI
      const openaiResponse = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          metaDescription: data.metaDescription,
          headings: data.headings,
          mainContent: data.mainContent,
          usePerplexity: false,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error("Failed to generate content");
      }

      const openaiData = await openaiResponse.json();
      if (openaiData.error) {
        throw new Error(openaiData.error);
      }

      // Update fields with the OpenAI response
      setTitle(openaiData.name || "");
      setDescription(openaiData.description || "");

      if (openaiData.tags && Array.isArray(openaiData.tags)) {
        const standardTags = TAG_OPTIONS.map((tag) => tag.value);

        interface FormattedTag {
          value: string;
          label: string;
          color: string;
        }

        const formattedTags = openaiData.tags
          .map(
            (tag: string) =>
              ({
                value: tag.toLowerCase().replace(/\s+/g, "-"),
                label: tag,
                color: "gray",
              } as FormattedTag)
          )
          .filter(
            (tag: FormattedTag) => tag.value && typeof tag.value === "string"
          );

        // Filter out any tags that already exist in TAG_OPTIONS
        const newTags = formattedTags.filter(
          (tag: FormattedTag) => !TAG_OPTIONS.some((t) => t.value === tag.value)
        );

        setAvailableTags([
          ...standardTags,
          ...formattedTags.map((t: FormattedTag) => t.value),
        ]);
        setSelectedTags(formattedTags.map((t: FormattedTag) => t.value));
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
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
            <div>
              <Label htmlFor="link" className="mb-2 block">
                URL
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={regenerateAll}
                  disabled={isGenerating || !link}
                  className="h-9 px-3 whitespace-nowrap"
                >
                  <Wand2
                    className={cn(
                      "h-3.5 w-3.5 mr-1.5",
                      isGenerating && "animate-spin"
                    )}
                  />
                  Redo
                </Button>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium">Content</Label>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
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
