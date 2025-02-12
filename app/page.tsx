"use client";

import { useState, useEffect } from "react";
import { Tool } from "../types/tool";
import { LoginModal } from "./components/LoginModal";
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
  Newspaper,
  LayoutGrid,
  Twitter,
  Youtube,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptFormModal } from "./components/prompts/PromptFormModal";
import { DeletePromptModal } from "./components/prompts/DeletePromptModal";
import { AddToolModal } from "./components/tools/AddToolModal";
import ToolItem from "./components/tools/ToolItem";
import { AddMediaModal } from "./components/media/AddMediaModal";
import { DeleteMediaModal } from "./components/media/DeleteMediaModal";
import MediaItem from "./components/media/MediaItem";
import { MediaGrid } from "./components/media/MediaGrid";
import DailySummaryCard from "./components/media/DailySummaryCard";
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

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>(
    {}
  );
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
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(
    null
  );
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isDeleteMediaModalOpen, setIsDeleteMediaModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTools();
    fetchPrompts();
    fetchMediaItems();
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
      const response = await fetch("/api/tools");
      if (!response.ok) {
        throw new Error("Failed to fetch tools");
      }
      const data = await response.json();
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

  async function fetchMediaItems() {
    try {
      const response = await fetch("/api/media");
      if (!response.ok) {
        throw new Error("Failed to fetch media items");
      }
      const data = await response.json();
      setMediaItems(data);
    } catch (error) {
      console.error("Error fetching media items:", error);
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
      const response = await fetch(`/api/tools/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          link,
          description,
          tags,
          is_personal_tool: isPersonalTool,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tool");
      }

      setTools(
        tools.map((tool) =>
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
      const response = await fetch(`/api/tools/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tool");
      }

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

  async function handleAddMediaItem(
    title: string,
    url: string,
    description: string,
    type: string
  ) {
    setIsProcessing(true);
    try {
      // Add the media item with the processed data
      const response = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          title,
          description,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add media item");
      }

      setIsAddModalOpen(false);
      await fetchMediaItems();
    } catch (error: any) {
      console.error("Error in handleAddMediaItem:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add media item",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEditMediaItem(
    title: string,
    url: string,
    description: string,
    type: string
  ) {
    if (!selectedMediaItem) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/media/${selectedMediaItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          url,
          description,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update media item");
      }

      setIsMediaModalOpen(false);
      setSelectedMediaItem(null);
      await fetchMediaItems();
    } catch (error: any) {
      console.error("Error updating media item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update media item",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteMediaItem() {
    if (!selectedMediaItem) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/media/${selectedMediaItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete media item");
      }

      setIsDeleteMediaModalOpen(false);
      setSelectedMediaItem(null);
      await fetchMediaItems();
    } catch (error: any) {
      console.error("Error deleting media item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete media item",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const groupMediaItemsByDate = (items: MediaItem[]) => {
    const groups: { [key: string]: MediaItem[] } = {};

    items.forEach((item) => {
      const date = new Date(item.created_at);
      // Convert to Pacific time for grouping
      const pacificDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      const dateKey = pacificDate.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }).split(",")[0];

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => {
        const dateAObj = new Date(dateA);
        const dateBObj = new Date(dateB);
        return dateBObj.getTime() - dateAObj.getTime();
      })
      .map(([date, items]) => ({
        date,
        items: items.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          AI Arsenal <span className="text-gray-400">⚔️</span>
        </h1>
        <div className="flex items-center gap-3">
          {isUserAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setActiveTab("tools");
                  setIsAddModalOpen(true);
                }}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Add Tool
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setActiveTab("prompts");
                  setIsAddModalOpen(true);
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Add Prompt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setActiveTab("media");
                  setIsAddModalOpen(true);
                }}>
                  <Newspaper className="h-4 w-4 mr-2" />
                  Add Media
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {user ? (
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button onClick={() => setIsLoginModalOpen(true)}>Sign In</Button>
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
          <TabsTrigger value="media">
            <Newspaper className="w-4 h-4 mr-2" />
            Media
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
                        disabled={processingIds[prompt.id]}
                        onClick={() => {
                          setSelectedPrompt(prompt);
                          setIsEditModalOpen(true);
                        }}
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
                        onClick={() => {
                          setSelectedPrompt(prompt);
                          setIsDeleteModalOpen(true);
                        }}
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

        <TabsContent value="media">
          <Tabs defaultValue="all" className="w-full">
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="all" className="w-10">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="article" className="w-10">
                  <Newspaper className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="tweet" className="w-10">
                  <Twitter className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="youtube" className="w-10">
                  <Youtube className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all">
              <div className="space-y-6">
                {groupMediaItemsByDate(mediaItems).map(({ date, items }) => (
                  <DailySummaryCard key={date} date={date} items={items} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="article">
              <MediaGrid
                items={mediaItems.filter((item) => item.type === "article")}
                onEdit={(item) => {
                  setSelectedMediaItem(item);
                  setIsMediaModalOpen(true);
                }}
                onDelete={(id) => {
                  const item = mediaItems.find((i) => i.id === id);
                  if (item) {
                    setSelectedMediaItem(item);
                    setIsDeleteMediaModalOpen(true);
                  }
                }}
                onReorder={setMediaItems}
                isAdmin={isUserAdmin}
              />
            </TabsContent>

            <TabsContent value="tweet">
              <MediaGrid
                items={mediaItems.filter((item) => item.type === "tweet")}
                onEdit={(item) => {
                  setSelectedMediaItem(item);
                  setIsMediaModalOpen(true);
                }}
                onDelete={(id) => {
                  const item = mediaItems.find((i) => i.id === id);
                  if (item) {
                    setSelectedMediaItem(item);
                    setIsDeleteMediaModalOpen(true);
                  }
                }}
                onReorder={setMediaItems}
                isAdmin={isUserAdmin}
              />
            </TabsContent>

            <TabsContent value="youtube">
              <MediaGrid
                items={mediaItems.filter((item) => item.type === "youtube")}
                onEdit={(item) => {
                  setSelectedMediaItem(item);
                  setIsMediaModalOpen(true);
                }}
                onDelete={(id) => {
                  const item = mediaItems.find((i) => i.id === id);
                  if (item) {
                    setSelectedMediaItem(item);
                    setIsDeleteMediaModalOpen(true);
                  }
                }}
                onReorder={setMediaItems}
                isAdmin={isUserAdmin}
              />
            </TabsContent>
          </Tabs>
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

      <AddMediaModal
        isOpen={isAddModalOpen && activeTab === "media"}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMediaItem}
        initialData={null}
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

      {selectedMediaItem && (
        <>
          <AddMediaModal
            isOpen={isMediaModalOpen}
            onClose={() => {
              setIsMediaModalOpen(false);
              setSelectedMediaItem(null);
            }}
            onSubmit={handleEditMediaItem}
            initialData={selectedMediaItem}
            mode="edit"
            isProcessing={isProcessing}
          />
          <DeleteMediaModal
            isOpen={isDeleteMediaModalOpen}
            onClose={() => {
              setIsDeleteMediaModalOpen(false);
              setSelectedMediaItem(null);
            }}
            onDelete={handleDeleteMediaItem}
            item={selectedMediaItem}
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
