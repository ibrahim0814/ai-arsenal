"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { TAG_OPTIONS } from "@/lib/constants";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { X } from "lucide-react";
import { cn, formatTagLabel } from "@/lib/utils";

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (
    link: string,
    title: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) => Promise<void>;
}

interface TagOption {
  value: string;
  label: string;
  color: string;
}

export function AddToolModal({
  isOpen,
  onClose,
  onAddTool,
}: AddToolModalProps) {
  const [link, setLink] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>(TAG_OPTIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalTool, setIsPersonalTool] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setLink("");
      setIsManual(false);
      setManualTitle("");
      setManualDescription("");
      setSelectedTags([]);
      setAvailableTags(TAG_OPTIONS);
      setError(null);
      setIsPersonalTool(false);
      setIsValidUrl(true);
    }
  }, [isOpen]);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return (
        url === "" ||
        /^https?:\/\/[\w\-\.]+(\.[\w\-\.]+)+[\/\w\-\.\/?=&%]*$/.test(url)
      );
    }
  };

  // Add effect for URL validation with debounce
  useEffect(() => {
    if (link === "") {
      setIsValidUrl(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsValidUrl(validateUrl(link));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [link]);

  const generateDescription = async (url: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      // First attempt with Cheerio + OpenAI
      const response = await fetch("/api/fetch-webpage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
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
            title: url,
            metaDescription: "",
            headings: "",
            mainContent: "",
            usePerplexity: true,
          }),
        });

        if (!perplexityResponse.ok) {
          throw new Error("Failed to generate description with Perplexity");
        }

        const perplexityData = await perplexityResponse.json();
        if (perplexityData.error) {
          throw new Error(perplexityData.error);
        }

        // Update fields with Perplexity response
        setManualTitle(perplexityData.name || "");
        setManualDescription(perplexityData.description || "");

        // Update tags from Perplexity response
        if (perplexityData.tags && Array.isArray(perplexityData.tags)) {
          const formattedTags = perplexityData.tags
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

          setAvailableTags((prev) => [...TAG_OPTIONS, ...newTags]);
          setSelectedTags(formattedTags.map((t: TagOption) => t.value));
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
        throw new Error("Failed to generate description");
      }

      const openaiData = await openaiResponse.json();
      if (openaiData.error) {
        throw new Error(openaiData.error);
      }

      // Update fields with the OpenAI response
      setManualTitle(openaiData.name || "");
      setManualDescription(openaiData.description || "");

      // Update available and selected tags
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

        setAvailableTags((prev) => [...TAG_OPTIONS, ...newTags]);
        setSelectedTags(formattedTags.map((t: TagOption) => t.value));
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate description");
    } finally {
      setIsGenerating(false);
    }
  };

  // Add effect to auto-generate when URL changes and not in manual mode
  useEffect(() => {
    if (link && !isManual && isValidUrl) {
      const timer = setTimeout(() => {
        generateDescription(link);
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [link, isValidUrl]); // Watch both link and validation state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (link) {
      setIsSubmitting(true);
      setError(null);
      try {
        if (isManual && (!manualTitle || !manualDescription)) {
          throw new Error(
            "Please fill in both title and description when using manual mode"
          );
        }

        await onAddTool(
          link,
          manualTitle,
          manualDescription,
          selectedTags,
          isPersonalTool
        );

        // Reset form
        setLink("");
        setManualTitle("");
        setManualDescription("");
        setSelectedTags([]);
        setIsPersonalTool(false);
        onClose();
      } catch (error: any) {
        setError(error.message || "Failed to add tool. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError("Please enter a URL");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Enter the URL of the AI tool you want to add to your list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* URL and Generation Controls */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="link" className="mb-2 block">
                  URL
                </Label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="link"
                    type="text"
                    placeholder="https://example.com"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <div className="flex items-center gap-2 min-w-fit">
                    <Switch
                      id="manual-mode"
                      checked={isManual}
                      onCheckedChange={setIsManual}
                    />
                    <Label
                      htmlFor="manual-mode"
                      className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                      Manual
                    </Label>
                  </div>
                </div>
                {!isValidUrl && link !== "" && !isGenerating && (
                  <p className="text-sm text-red-500 mt-1">
                    Please enter a valid URL
                  </p>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              {!isManual ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Auto-generated Content
                    </Label>
                    {isGenerating && (
                      <span className="text-sm text-muted-foreground animate-pulse">
                        Generating...
                      </span>
                    )}
                  </div>
                  {manualTitle || manualDescription ? (
                    <div className="space-y-2">
                      <div className="font-medium">{manualTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {manualDescription}
                      </div>
                    </div>
                  ) : !isGenerating && link && !isValidUrl ? (
                    <div className="text-sm text-muted-foreground">
                      Enter a valid URL to auto-generate description and tags
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="mt-1.5"
                      required={isManual}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      className="mt-1.5"
                      required={isManual}
                    />
                  </div>
                </div>
              )}
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
                          {availableTags.map((tagOption) => (
                            <CommandItem
                              key={tagOption.value}
                              onSelect={() => {
                                setSelectedTags((prev) =>
                                  prev.includes(tagOption.value)
                                    ? prev.filter((t) => t !== tagOption.value)
                                    : [...prev, tagOption.value]
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTags.includes(tagOption.value)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                                {formatTagLabel(tagOption.value)}
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
                    {selectedTags.map((tag) => {
                      const tagOption = availableTags.find(
                        (t) => t.value === tag
                      );
                      return (
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
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="current-stack"
                  checked={isPersonalTool}
                  onCheckedChange={setIsPersonalTool}
                />
                <Label htmlFor="current-stack">Add to Current Stack</Label>
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
              {isSubmitting ? "Adding Tool..." : "Add Tool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
