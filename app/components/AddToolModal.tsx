"use client";

import { useState } from "react";
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

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (
    link: string,
    manualData?: { title: string; description: string }
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          isManual
            ? { title: manualTitle, description: manualDescription }
            : undefined
        );
        setLink("");
        setManualTitle("");
        setManualDescription("");
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
                  : "Adding + Generating Description..."
                : "Add Tool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
