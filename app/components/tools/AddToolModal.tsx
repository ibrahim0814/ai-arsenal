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
import { TAG_OPTIONS } from "@/lib/constants";
import { Check, ChevronsUpDown, Wand2 } from "lucide-react";
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
import type { TagOption } from "@/types";

interface AddToolModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    link: string,
    title: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) => Promise<void>;
}

export function AddToolModal({ open, onClose, onAdd }: AddToolModalProps) {
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
  const [isGeneratingPerplexity, setIsGeneratingPerplexity] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
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
  }, [open]);

  const validateUrl = (url: string) => {
    // If empty, it's valid (we'll handle this case elsewhere)
    if (url === "") return true;

    // Add https:// if no protocol is specified
    const urlWithProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;

    try {
      new URL(urlWithProtocol);
      return true;
    } catch {
      return /^[\w\-\.]+(\.[\w\-\.]+)+[\/\w\-\.\/?=&%]*$/.test(url);
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
      setIsLoading(true);

      // Try to fetch webpage content first
      const response = await fetch("/api/fetch-webpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      // Whether the fetch succeeds or fails, we'll try OpenAI
      // If fetch succeeds, we'll pass the content. If it fails, we'll just pass the URL
      const webData = response.ok ? await response.json() : null;

      const openaiResponse = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: webData?.title || url,
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
      handleApiResponse(openaiData);
    } catch (error: any) {
      setError(error.message || "Failed to generate description");
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  const generateWithPerplexity = async (url: string) => {
    setIsGeneratingPerplexity(true);
    setError(null);
    try {
      // Add https:// if no protocol is specified
      const urlWithProtocol = url.match(/^https?:\/\//)
        ? url
        : `https://${url}`;

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
      setManualTitle(data.webpageInfo?.title || data.name || "");
      setManualDescription(
        data.generatedInfo?.description || data.description || ""
      );

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
          .filter((tag: any) => tag.value && typeof tag.value === "string");

        // Filter out any tags that already exist in TAG_OPTIONS
        const newTags = formattedTags.filter(
          (tag: any) => !TAG_OPTIONS.some((t) => t.value === tag.value)
        );

        setAvailableTags((prev) => [...TAG_OPTIONS, ...newTags]);
        setSelectedTags(formattedTags.map((t: any) => t.value));
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate content with Perplexity");
    } finally {
      setIsGeneratingPerplexity(false);
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

        await onAdd(
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

  // Add helper function to handle API responses
  const handleApiResponse = (data: any) => {
    if (data.error) {
      throw new Error(data.error);
    }

    // Update fields with the response
    setManualTitle(data.name || "");
    setManualDescription(data.description || "");

    // Update available and selected tags
    if (data.tags && Array.isArray(data.tags)) {
      const formattedTags = data.tags
        .map((tag: string) => ({
          value: tag.toLowerCase().replace(/\s+/g, "-"),
          label: tag,
          color: "gray",
        }))
        .filter((tag: TagOption) => tag.value && typeof tag.value === "string");

      // Filter out any tags that already exist in TAG_OPTIONS
      const newTags = formattedTags.filter(
        (tag: TagOption) => !TAG_OPTIONS.some((t) => t.value === tag.value)
      );

      setAvailableTags((prev) => [...TAG_OPTIONS, ...newTags]);
      setSelectedTags(formattedTags.map((t: TagOption) => t.value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Enter the URL of the AI tool you want to add to your list.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6">
            <div className="grid gap-6 py-4">
              {/* URL and Generation Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="link" className="text-sm font-medium">
                      URL
                    </Label>
                    <div className="flex items-center gap-2">
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
                  <Input
                    id="link"
                    type="text"
                    placeholder="https://example.com"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full"
                    required
                  />
                  {!isValidUrl &&
                    link !== "" &&
                    !isGenerating &&
                    !isGeneratingPerplexity && (
                      <p className="text-sm text-red-500">
                        Please enter a valid URL
                      </p>
                    )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateDescription(link)}
                      disabled={isGenerating || !link || !isValidUrl}
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
                      onClick={() => generateWithPerplexity(link)}
                      disabled={isGeneratingPerplexity || !link || !isValidUrl}
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
              </div>

              {/* Content Section */}
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
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
                        <div className="font-medium dark:text-gray-200">
                          {manualTitle}
                        </div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400">
                          {manualDescription}
                        </div>
                      </div>
                    ) : !isGenerating && link && !isValidUrl ? (
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
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
                                      ? prev.filter(
                                          (t) => t !== tagOption.value
                                        )
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
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
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
          </div>

          <div className="p-6 flex flex-col-reverse sm:flex-row justify-end gap-2 mt-auto border-t">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="secondary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding Tool..." : "Add Tool"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
