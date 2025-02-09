"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PromptFormModal } from "./PromptFormModal";
import { DeletePromptModal } from "./DeletePromptModal";
import { useToast } from "@/components/ui/use-toast";

interface Prompt {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export function PromptList({ prompts: initialPrompts }: { prompts: Prompt[] }) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const { toast } = useToast();

  const handleAdd = async (title: string, content: string, type: string) => {
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, type }),
      });

      if (!response.ok) {
        throw new Error("Failed to add prompt");
      }

      const newPrompt = await response.json();
      setPrompts([newPrompt, ...prompts]);
    } catch (error) {
      console.error("Error adding prompt:", error);
    }
  };

  const handleEdit = async (title: string, content: string, type: string) => {
    try {
      const response = await fetch(`/api/prompts/${selectedPrompt?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, type }),
      });

      if (!response.ok) {
        throw new Error("Failed to update prompt");
      }

      const updatedPrompt = await response.json();
      setPrompts(
        prompts.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p))
      );
    } catch (error) {
      console.error("Error updating prompt:", error);
    }
  };

  const handleDelete = async () => {
    if (selectedPrompt) {
      setPrompts(prompts.filter((p) => p.id !== selectedPrompt.id));
    }
  };

  const handleCopy = (content: string) => {
    setTimeout(() => {
      try {
        navigator.clipboard.writeText(content);
        toast({
          title: "Copied!",
          description: "Prompt copied to clipboard",
          duration: 2000,
        });
      } catch (error) {
        console.error("Copy failed:", error);
        toast({
          title: "Error",
          description: "Failed to copy prompt",
          variant: "destructive",
          duration: 2000,
        });
      }
    }, 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Prompts</h2>
        <Button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="group relative bg-card rounded-xl border border-border/40 shadow-sm transition-all hover:shadow-md hover:border-border/80 overflow-hidden"
          >
            <div className="w-full bg-muted px-6 py-2.5 flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-none tracking-tight">
                {prompt.title}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {prompt.type}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 group-hover:opacity-100"
                  onClick={() => handleCopy(prompt.content)}
                  title="Copy to clipboard"
                >
                  <span className="sr-only">Copy</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setIsEditModalOpen(true);
                  }}
                >
                  <span className="sr-only">Edit</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <span className="sr-only">Delete</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="relative bg-muted/50 rounded-lg">
                <div className="overflow-y-auto max-h-[120px] font-mono text-sm text-muted-foreground p-4">
                  {prompt.content}
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <p className="text-xs text-muted-foreground">
                  Created {new Date(prompt.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PromptFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAdd}
        mode="add"
      />
      {selectedPrompt && (
        <>
          <PromptFormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPrompt(null);
            }}
            initialData={selectedPrompt}
            onSubmit={handleEdit}
            mode="edit"
          />
          <DeletePromptModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPrompt(null);
            }}
            prompt={selectedPrompt}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}
