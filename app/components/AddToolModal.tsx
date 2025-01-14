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

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (link: string) => Promise<void>;
}

export function AddToolModal({
  isOpen,
  onClose,
  onAddTool,
}: AddToolModalProps) {
  const [link, setLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (link) {
      setIsSubmitting(true);
      setError(null);
      try {
        await onAddTool(link);
        setLink("");
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
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Adding and Generating Description..."
                : "Add Tool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
