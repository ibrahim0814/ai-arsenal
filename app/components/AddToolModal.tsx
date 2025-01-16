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
import { cn } from "@/lib/utils";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalTool, setIsPersonalTool] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLink("");
      setIsManual(false);
      setManualTitle("");
      setManualDescription("");
      setSelectedTags([]);
      setError(null);
    }
  }, [isOpen]);

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Enter the URL of the AI tool you want to add to your list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <div className="col-span-3">
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
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {TAG_OPTIONS.map((tagOption) => (
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
                              {tagOption.label}
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
                        className="text-xs"
                        onClick={() =>
                          setSelectedTags((prev) =>
                            prev.filter((t) => t !== tag)
                          )
                        }
                      >
                        {tag}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-stack" className="text-right">
                Current Stack
              </Label>
              <div className="col-span-3">
                <Switch
                  id="current-stack"
                  checked={isPersonalTool}
                  onCheckedChange={setIsPersonalTool}
                />
              </div>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="manual-mode">Manual Input</Label>
                <span className="text-sm text-muted-foreground">
                  Override AI-generated content
                </span>
              </div>
              <Switch
                id="manual-mode"
                checked={isManual}
                onCheckedChange={setIsManual}
              />
            </div>
            {isManual ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="col-span-3"
                    required={isManual}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="link" className="text-right">
                    URL
                  </Label>
                  <Input
                    id="link"
                    type="text"
                    pattern="^(https?:\/\/)?[\w\-\.]+(\.[\w\-\.]+)+[\/\w\-\.\/?=&%]*$"
                    placeholder="https://example.com"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="col-span-3"
                    required={isManual}
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="link" className="text-right">
                  URL
                </Label>
                <Input
                  id="link"
                  type="text"
                  pattern="^(https?:\/\/)?[\w\-\.]+(\.[\w\-\.]+)+[\/\w\-\.\/?=&%]*$"
                  placeholder="https://example.com"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isManual
                  ? "Adding Tool..."
                  : "Adding plus Generating Description..."
                : "Add Tool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
