import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Prompt {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

interface PromptsContentProps {
  prompts: Prompt[];
  isAdmin: boolean;
  processingIds: Record<string, boolean>;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
}

export function PromptsContent({
  prompts,
  isAdmin,
  processingIds,
  onEdit,
  onDelete,
}: PromptsContentProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const { toast } = useToast();

  const togglePromptExpansion = (promptId: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [promptId]: !prev[promptId],
    }));
  };

  const renderActions = (prompt: Prompt) => (
    <div className="absolute top-2 right-2 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(prompt)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400"
            onClick={() => onDelete(prompt)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-2">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="w-full border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow relative"
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {prompt.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {prompt.type === "operator"
                    ? "🤖 Operator Agent"
                    : "💭 Normal Prompt"}
                </p>
              </div>
              {isAdmin && renderActions(prompt)}
            </div>
          </div>
          <div className="mx-4 mb-4">
            <div
              className={`bg-gray-50 dark:bg-gray-800 p-2 rounded-lg relative ${
                prompt.content.split("\n").length <= 1 ? "pb-4" : "pb-3"
              }`}
            >
              <div className="pr-12">
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    !expandedPrompts[prompt.id] ? "max-h-[130px]" : ""
                  }`}
                >
                  <pre
                    className={`text-sm font-mono whitespace-pre-wrap break-words px-3 pt-2 text-gray-800 dark:text-gray-200 ${
                      prompt.content.split("\n").length <= 1 ? "pb-2" : "pb-3"
                    }`}
                  >
                    {prompt.content}
                  </pre>
                </div>
                {prompt.content.split("\n").length > 5 && (
                  <div className="h-6" />
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-3 right-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(prompt.content);
                    setCopiedPromptId(prompt.id);
                    setTimeout(() => setCopiedPromptId(null), 2000);
                  } catch (err) {
                    console.error("Failed to copy text: ", err);
                    toast({
                      title: "Error",
                      description: "Failed to copy prompt",
                      variant: "destructive",
                      duration: 2000,
                    });
                  }
                }}
              >
                {copiedPromptId === prompt.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              {prompt.content.split("\n").length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-14 right-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700"
                  onClick={() => togglePromptExpansion(prompt.id)}
                >
                  {expandedPrompts[prompt.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
