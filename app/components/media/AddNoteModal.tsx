import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  isProcessing?: boolean;
}

export function AddNoteModal({
  isOpen,
  onClose,
  onSubmit,
  isProcessing = false,
}: AddNoteModalProps) {
  const [content, setContent] = useState("");

  const handleClose = () => {
    setContent("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await onSubmit(content);
    setContent("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>What's on your mind</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Share your thoughts on AI developments and predictions
          </p>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 pt-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
              autoFocus
              required
            />
          </div>

          <div className="p-6 flex justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing || !content.trim()}>
              {isProcessing ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Add Note"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
