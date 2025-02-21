import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

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

  return (
    <div className="grid grid-cols-1 gap-2">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="w-full border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {prompt.title}
                </h3>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {prompt.type === "operator"
                    ? "🤖 Operator Agent"
                    : "💭 Normal Prompt"}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2 ml-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processingIds[prompt.id]}
                    onClick={() => onEdit(prompt)}
                  >
                    {processingIds[prompt.id] ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Edit"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(prompt)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="mx-4 mb-4">
            <div
              className={`bg-gray-50 p-2 rounded-lg relative ${
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
                    className={`text-sm font-mono whitespace-pre-wrap break-words px-3 pt-2 ${
                      prompt.content.split("\n").length <= 1 ? "pb-2" : "pb-3"
                    }`}
                  >
                    {prompt.content}
                  </pre>
                </div>
                {prompt.content.split("\n").length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full flex items-center justify-center gap-1 hover:bg-gray-100"
                    onClick={() => togglePromptExpansion(prompt.id)}
                  >
                    {expandedPrompts[prompt.id] ? (
                      <>
                        Show Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show More <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white"
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
