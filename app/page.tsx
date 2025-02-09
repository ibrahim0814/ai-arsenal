"use client";

import { useState, useEffect } from "react";
import { Tool } from "../types/tool";
import { LoginModal } from "./components/LoginModal";
import { supabase, fetchWithRetry } from "../utils/supabase-client";
import { getCurrentUser, isAdmin, signOut } from "../utils/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  LogOut,
  Wrench,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptFormModal } from "./components/prompts/PromptFormModal";
import { DeletePromptModal } from "./components/prompts/DeletePromptModal";
import { AddToolModal } from "./components/tools/AddToolModal";
import ToolItem from "./components/tools/ToolItem";

interface Prompt {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("tools");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTools();
    fetchPrompts();
    checkUser();
  }, []);

  async function checkUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      const adminStatus = await isAdmin(currentUser);
      setIsUserAdmin(adminStatus);
    }
  }

  async function fetchTools() {
    setLoading(true);
    try {
      const { data, error } = await fetchWithRetry(
        async () =>
          await supabase
            .from("tools")
            .select("*")
            .order("created_at", { ascending: false })
      );

      if (error) throw error;

      setTools(data || []);
    } catch (error) {
      console.error("Error fetching tools:", error);
      setError(
        "Failed to fetch tools. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrompts() {
    try {
      const response = await fetch("/api/prompts");
      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    }
  }

  async function handleAddTool(
    link: string,
    title: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) {
    try {
      if (!title || !description) {
        // First fetch webpage content
        const webpageResponse = await fetch("/api/fetch-webpage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: link }),
        });

        if (!webpageResponse.ok) {
          throw new Error("Failed to fetch webpage");
        }

        const webpageData = await webpageResponse.json();

        // Then generate description using the content
        const generateResponse = await fetch("/api/generate-description", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `
              Title: ${webpageData.title}
              Description: ${webpageData.metaDescription}
              Heading: ${webpageData.h1Text}
              Content: ${webpageData.mainContent}
            `.trim(),
          }),
        });

        if (!generateResponse.ok) {
          throw new Error("Failed to generate description");
        }

        const { title: generatedTitle, description: generatedDescription } =
          await generateResponse.json();
        title = generatedTitle;
        description = generatedDescription;
      }

      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: link,
          title,
          description,
          tags,
          is_personal_tool: isPersonalTool,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to create tool");
      }

      setTools((prevTools) => [data, ...prevTools]);
    } catch (error: any) {
      console.error("Error in handleAddTool:", error);
      throw new Error(error.message || "Failed to create tool");
    }
  }

  async function editTool(
    id: string,
    title: string,
    link: string,
    description: string,
    tags: string[],
    isPersonalTool: boolean
  ) {
    try {
      const { data, error } = await supabase
        .from("tools")
        .update({
          title,
          link,
          description,
          tags,
          is_personal_tool: isPersonalTool,
        })
        .eq("id", id);

      if (error) throw error;

      setTools((prevTools) =>
        prevTools.map((tool) =>
          tool.id === id
            ? {
                ...tool,
                title,
                link,
                description,
                tags,
                is_personal_tool: isPersonalTool,
              }
            : tool
        )
      );
    } catch (error: any) {
      console.error("Error editing tool:", error);
      throw error;
    }
  }

  async function deleteTool(id: string) {
    if (!isUserAdmin) {
      setError("Only admins can delete tools.");
      return;
    }
    try {
      const { error } = await fetchWithRetry(
        async () => await supabase.from("tools").delete().eq("id", id)
      );

      if (error) throw error;

      setTools(tools.filter((tool) => tool.id !== id));
    } catch (error) {
      console.error("Error deleting tool:", error);
      setError("Failed to delete tool. Please try again.");
    }
  }

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      setError("Failed to sign out. Please try again.");
    } else {
      setUser(null);
      setIsUserAdmin(false);
    }
  }

  async function handleAddPrompt(title: string, content: string, type: string) {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add prompt");
      }

      setIsAddModalOpen(false);
      await fetchPrompts(); // Rehydrate the prompts list
    } catch (error: any) {
      console.error("Error in handleAddPrompt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add prompt",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEditPrompt(
    title: string,
    content: string,
    type: string
  ) {
    if (!selectedPrompt) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/prompts/${selectedPrompt.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update prompt");
      }

      setIsEditModalOpen(false);
      setSelectedPrompt(null);
      await fetchPrompts(); // Rehydrate the prompts list
    } catch (error: any) {
      console.error("Error updating prompt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update prompt",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeletePrompt() {
    if (!selectedPrompt) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/prompts/${selectedPrompt.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete prompt");
      }

      setIsDeleteModalOpen(false);
      setSelectedPrompt(null);
      await fetchPrompts(); // Rehydrate the prompts list
    } catch (error: any) {
      console.error("Error deleting prompt:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete prompt",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const togglePromptExpansion = (promptId: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [promptId]: !prev[promptId],
    }));
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchTools}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-8 pt-10 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            AI Arsenal 🛠️
          </h1>
          <p className="text-gray-600 mt-1">
            {activeTab === "tools"
              ? `Total Tools: ${tools.length}`
              : `Total Prompts: ${prompts.length}`}
          </p>
        </div>
        <div className="flex gap-2">
          {user ? (
            <>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                disabled={isProcessing}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isProcessing ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : activeTab === "tools" ? (
                  "Add Tool"
                ) : (
                  "Add Prompt"
                )}
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsLoginModalOpen(true)}>
              Admin Login
            </Button>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="tools"
        className="space-y-1 pb-6"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="tools">
            <Wrench className="w-4 h-4 mr-2" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <FileText className="w-4 h-4 mr-2" />
            Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="grid grid-cols-1 gap-2">
          {tools.map((tool) => (
            <ToolItem
              key={tool.id}
              tool={tool}
              onEdit={editTool}
              onDelete={deleteTool}
              isAdmin={isUserAdmin}
            />
          ))}
        </TabsContent>

        <TabsContent value="prompts" className="grid grid-cols-1 gap-2">
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
                  {isUserAdmin && (
                    <div className="flex gap-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => {
                          setSelectedPrompt(prompt);
                          setIsEditModalOpen(true);
                        }}
                      >
                        {isProcessing ? (
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
                        disabled={isProcessing}
                        onClick={() => {
                          setSelectedPrompt(prompt);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        {isProcessing ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          "Delete"
                        )}
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
                          prompt.content.split("\n").length <= 1
                            ? "pb-2"
                            : "pb-3"
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
        </TabsContent>
      </Tabs>

      <AddToolModal
        open={isAddModalOpen && activeTab === "tools"}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTool}
      />

      <PromptFormModal
        isOpen={isAddModalOpen && activeTab === "prompts"}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPrompt}
        mode="add"
        isProcessing={isProcessing}
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
            mode="edit"
            onSubmit={handleEditPrompt}
            isProcessing={isProcessing}
          />
          <DeletePromptModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPrompt(null);
            }}
            onDelete={handleDeletePrompt}
            prompt={selectedPrompt}
            isProcessing={isProcessing}
          />
        </>
      )}

      <LoginModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          checkUser(); // Re-check user status after successful login
        }}
      />
    </main>
  );
}
