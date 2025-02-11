import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Tweet } from "react-tweet";
import YouTubeEmbed from "./YouTubeEmbed";

interface MediaItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  type: "article" | "tweet" | "youtube" | "other";
  embedHtml?: string;
  videoId?: string;
  created_at: string;
}

interface ProcessedData {
  type: "article" | "tweet" | "youtube" | "other";
  title: string;
  description: string;
  embedHtml?: string;
  videoId?: string;
}

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    url: string,
    description: string,
    type: string
  ) => Promise<void>;
  initialData: MediaItem | null;
  mode?: "add" | "edit";
  isProcessing?: boolean;
}

export function AddMediaModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "add",
  isProcessing = false,
}: AddMediaModalProps) {
  const [url, setUrl] = useState(initialData?.url || "");
  const [preview, setPreview] = useState<ProcessedData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  // Reset state when modal closes or initialData changes
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setPreview(null);
      setIsLoadingPreview(false);
      setEditedTitle("");
      setEditedDescription("");
      setShowEdit(false);
    } else if (initialData && mode === "edit") {
      setUrl(initialData.url);
      setPreview({
        type: initialData.type as "article" | "tweet" | "youtube" | "other",
        title: initialData.title,
        description: initialData.description || "",
        embedHtml: initialData.embedHtml,
        videoId: initialData.videoId,
      });
      setEditedTitle(initialData.title);
      setEditedDescription(initialData.description || "");
      setShowEdit(true);
    }
  }, [isOpen, initialData, mode]);

  const getTweetId = (url: string): string => {
    return url.split("/").pop()?.split("?")[0] || "";
  };

  const loadPreview = async (url: string) => {
    if (!url) return;

    setIsLoadingPreview(true);
    try {
      const response = await fetch("/api/media/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to process URL");
      }

      const data = await response.json();
      setPreview(data);
      setEditedTitle(data.title);
      setEditedDescription(data.description || "");
      setShowEdit(true);
    } catch (error: any) {
      console.error("Error loading preview:", error);
      setPreview(null);
      setShowEdit(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    if (newUrl) {
      loadPreview(newUrl);
    } else {
      setPreview(null);
      setShowEdit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;

    const title = showEdit ? editedTitle : preview.title;
    const description = showEdit ? editedDescription : preview.description;
    const type = preview.type;

    await onSubmit(title, url, description, type);
    if (mode === "add") {
      setUrl("");
      setPreview(null);
      setShowEdit(false);
      setEditedTitle("");
      setEditedDescription("");
    }
  };

  const renderPreview = () => {
    if (!preview) return null;

    switch (preview.type) {
      case "tweet":
        return (
          <div className="mt-4 border rounded-lg p-4">
            <Tweet id={getTweetId(url)} />
          </div>
        );
      case "youtube":
        return (
          <div className="mt-4 border rounded-lg p-4">
            {preview.videoId ? (
              <YouTubeEmbed videoId={preview.videoId} />
            ) : (
              <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Video not available</p>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="mt-4 border rounded-lg p-4">
            <h3 className="font-semibold text-lg">{preview.title}</h3>
            <p className="text-gray-600 mt-2">{preview.description}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              Visit URL
            </a>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>
            {mode === "add" ? "Add New Media Item" : "Edit Media Item"}
          </DialogTitle>
          {mode === "add" && (
            <p className="text-sm text-gray-500 mt-2">
              Paste any URL - articles, X posts, YouTube videos etc.
            </p>
          )}
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6 pb-4">
            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                value={url}
                onChange={handleUrlChange}
                placeholder="Paste URL from X/Twitter, YouTube, or any article"
                type="url"
                required
                autoFocus={mode === "add"}
                className="mt-1.5"
              />
            </div>

            {isLoadingPreview && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            {preview && renderPreview()}

            {showEdit && (
              <div className="space-y-4 mt-4 pb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Enter description"
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 flex justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || isLoadingPreview || !preview}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : mode === "add" ? (
                "Add Media Item"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
