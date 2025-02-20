"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  StickyNote,
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
import { AddNoteModal } from "./components/media/AddNoteModal";
import Note from "./components/media/Note";
import { EditNoteModal } from "./components/media/EditNoteModal";
import { DeleteNoteModal } from "./components/media/DeleteNoteModal";
import { SearchBar } from "./components/tools/SearchBar";
import { indexTools } from "@/lib/meilisearch";
import { toPacificDate, formatPacificDate } from "@/utils/date";

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

interface Note {
  id: string;
  content: string;
  created_at: string;
  type: "note";
}

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
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
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const latestSearchRef = useRef<string>("");

  useEffect(() => {
    fetchTools();
    fetchPrompts();
    fetchMediaItems();
    fetchNotes();
    checkUser();
  }, []);

  useEffect(() => {
    if (tools.length > 0) {
      indexTools(tools).catch(console.error);
    }
  }, [tools]);

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

  async function fetchNotes() {
    try {
      const response = await fetch("/api/notes");
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      setNotes(data.map((note: any) => ({ ...note, type: "note" as const })));
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }

  const handleSearch = useCallback(
    async (query: string) => {
      // Store the current search query
      latestSearchRef.current = query;

      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/tools/search?q=${encodeURIComponent(query)}`
        );

        // Only update results if this is still the latest search
        if (latestSearchRef.current === query) {
          if (!response.ok) {
            throw new Error("Failed to search tools");
          }
          const data = await response.json();
          setSearchResults(data.hits);
          setIsSearching(false);
        }
      } catch (error) {
        // Only show error if this is still the latest search
        if (latestSearchRef.current === query) {
          console.error("Error searching tools:", error);
          toast({
            title: "Error",
            description: "Failed to search tools. Please try again.",
            variant: "destructive",
          });
          setIsSearching(false);
        }
      }
    },
    [toast]
  );

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

  const groupContentByDate = (mediaItems: MediaItem[], notes: Note[]) => {
    const groups: { [key: string]: (MediaItem | Note)[] } = {};

    // Helper function to add item to the appropriate date group
    const addToGroup = (item: MediaItem | Note) => {
      const date = new Date(item.created_at);
      // Add 8 hours to match Pacific time
      date.setHours(date.getHours() + 8);
      // Get just the date part for grouping (without changing the original timestamp)
      const dateKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    };

    // Add all items to their respective date groups
    mediaItems.forEach(addToGroup);
    notes
      .map((note) => ({ ...note, type: "note" as const }))
      .forEach(addToGroup);

    // Sort dates and items within each date
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => {
        // Convert the date strings back to Date objects for the first item in each group
        const dateAFirstItem = new Date(groups[dateA][0].created_at);
        const dateBFirstItem = new Date(groups[dateB][0].created_at);
        dateAFirstItem.setHours(dateAFirstItem.getHours() + 8);
        dateBFirstItem.setHours(dateBFirstItem.getHours() + 8);
        return dateBFirstItem.getTime() - dateAFirstItem.getTime();
      })
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          dateA.setHours(dateA.getHours() + 8);
          dateB.setHours(dateB.getHours() + 8);
          return dateB.getTime() - dateA.getTime();
        }),
      }));
  };

  async function handleAddNote(content: string) {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      setIsAddNoteModalOpen(false);
      await fetchNotes();
    } catch (error: any) {
      console.error("Error in handleAddNote:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

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
    <main className="container mx-auto px-4 sm:px-8 pt-4 sm:pt-10 pb-6">
      <div className="flex justify-between items-center gap-4 mb-6">
        <div className="flex items-center ml-2">
          <h1 className="text-xl sm:text-2xl font-bold">AI Arsenal</h1>
          <span className="text-2xl sm:text-3xl ml-1.5 sm:ml-2 -mt-1">⚔️</span>
        </div>
        <div className="flex items-center gap-2">
          {isUserAdmin && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="sm:hidden" title="Add Item">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("tools");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Add Tool
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("prompts");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Prompt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("media");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Newspaper className="h-4 w-4 mr-2" />
                    Add Media
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Button
                  onClick={() => setIsAddNoteModalOpen(true)}
                  size="icon"
                  className="sm:hidden"
                  title="Quick Note"
                >
                  <StickyNote className="h-4 w-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="hidden sm:flex">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("tools");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Add Tool
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("prompts");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Prompt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setActiveTab("media");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Newspaper className="h-4 w-4 mr-2" />
                    Add Media
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Button
                  onClick={() => setIsAddNoteModalOpen(true)}
                  className="hidden sm:flex"
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  Quick Note
                </Button>
              )}
            </>
          )}
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="sm:hidden"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                onClick={() => setIsLoginModalOpen(true)}
                className="sm:hidden"
                title="Sign In"
              >
                <LogOut className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden sm:flex"
              >
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={`flex flex-col ${user ? "lg:flex-row lg:gap-6" : ""}`}>
        <div className={`w-full ${user ? "lg:w-[70%]" : ""}`}>
          <Tabs defaultValue="tools" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <TabsList className="flex overflow-x-auto justify-start">
                <TabsTrigger value="tools" className="min-w-[100px]">
                  <Wrench className="h-4 w-4 mr-2" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="prompts" className="min-w-[100px]">
                  <FileText className="h-4 w-4 mr-2" />
                  Prompts
                </TabsTrigger>
                <TabsTrigger value="media" className="min-w-[100px]">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Media
                </TabsTrigger>
              </TabsList>
              {activeTab === "tools" && (
                <div className="w-full sm:w-auto sm:ml-auto">
                  <SearchBar
                    onSearch={handleSearch}
                    className="w-full sm:w-[300px]"
                  />
                </div>
              )}
            </div>

            <TabsContent value="tools" className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {isSearching ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">
                      Searching tools...
                    </p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((tool) => (
                    <ToolItem
                      key={tool.id}
                      tool={tool}
                      onEdit={editTool}
                      onDelete={deleteTool}
                      isAdmin={isUserAdmin}
                    />
                  ))
                ) : searchResults.length === 0 && isSearching === false ? (
                  tools.map((tool) => (
                    <ToolItem
                      key={tool.id}
                      tool={tool}
                      onEdit={editTool}
                      onDelete={deleteTool}
                      isAdmin={isUserAdmin}
                    />
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No tools found</p>
                  </div>
                )}
              </div>
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
                <div className="mb-2 flex">
                  <TabsList className="flex overflow-x-auto">
                    <TabsTrigger
                      value="all"
                      className="flex-1 sm:flex-none min-w-[60px]"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="article"
                      className="flex-1 sm:flex-none min-w-[60px]"
                    >
                      <Newspaper className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="tweet"
                      className="flex-1 sm:flex-none min-w-[60px]"
                    >
                      <Twitter className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="youtube"
                      className="flex-1 sm:flex-none min-w-[60px]"
                    >
                      <Youtube className="h-4 w-4" />
                    </TabsTrigger>
                    {user && (
                      <TabsTrigger
                        value="notes"
                        className="flex-1 sm:flex-none min-w-[60px]"
                      >
                        <StickyNote className="h-4 w-4" />
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <TabsContent value="all">
                  <div className="space-y-3">
                    {groupContentByDate(mediaItems, user ? notes : []).map(
                      ({ date, items }) => (
                        <DailySummaryCard
                          key={date}
                          date={date}
                          items={items}
                          isAdmin={isUserAdmin}
                          onEditNote={(note) => {
                            setSelectedNote({ ...note, type: "note" });
                            setIsEditNoteModalOpen(true);
                          }}
                          onDeleteNote={(id) => {
                            const note = notes.find((n) => n.id === id);
                            if (note) {
                              setSelectedNote({ ...note, type: "note" });
                              setIsDeleteNoteModalOpen(true);
                            }
                          }}
                          onEditMedia={(item) => {
                            setSelectedMediaItem(item);
                            setIsMediaModalOpen(true);
                          }}
                          onDeleteMedia={(id) => {
                            const mediaItem = mediaItems.find(
                              (i) => i.id === id
                            );
                            if (mediaItem) {
                              setSelectedMediaItem(mediaItem);
                              setIsDeleteMediaModalOpen(true);
                            }
                          }}
                        />
                      )
                    )}
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

                <TabsContent value="notes">
                  <div className="border rounded-lg bg-white overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b">
                      <h2 className="text-lg font-medium flex items-center justify-center gap-2">
                        <span className="text-gray-800">🗒️</span>
                        <span>Notes</span>
                      </h2>
                    </div>
                    <div className="p-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
                      {notes.map((note) => (
                        <Note
                          key={note.id}
                          note={note}
                          isAdmin={isUserAdmin}
                          onEdit={(note) => {
                            setSelectedNote({ ...note, type: "note" });
                            setIsEditNoteModalOpen(true);
                          }}
                          onDelete={(id) => {
                            const note = notes.find((n) => n.id === id);
                            if (note) {
                              setSelectedNote({ ...note, type: "note" });
                              setIsDeleteNoteModalOpen(true);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>

        {user && (
          <div className="hidden lg:block lg:w-[30%] lg:sticky lg:top-4">
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="bg-gray-50/80 px-4 py-3 border-b">
                <h2 className="text-lg font-medium flex items-center justify-center gap-2">
                  <span className="text-gray-800">🗒️</span>
                  <span>Notes</span>
                </h2>
              </div>
              <div className="p-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
                {notes.map((note) => (
                  <Note
                    key={note.id}
                    note={note}
                    isAdmin={isUserAdmin}
                    onEdit={(note) => {
                      setSelectedNote({ ...note, type: "note" });
                      setIsEditNoteModalOpen(true);
                    }}
                    onDelete={(id) => {
                      const note = notes.find((n) => n.id === id);
                      if (note) {
                        setSelectedNote({ ...note, type: "note" });
                        setIsDeleteNoteModalOpen(true);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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

      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        onSubmit={handleAddNote}
        isProcessing={isProcessing}
      />

      {selectedNote && (
        <>
          <EditNoteModal
            isOpen={isEditNoteModalOpen}
            onClose={() => {
              setIsEditNoteModalOpen(false);
              setSelectedNote(null);
            }}
            initialContent={selectedNote.content}
            onSubmit={async (content) => {
              try {
                const response = await fetch(`/api/notes/${selectedNote.id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ content }),
                });

                if (!response.ok) {
                  throw new Error("Failed to update note");
                }

                await fetchNotes();
                setIsEditNoteModalOpen(false);
                setSelectedNote(null);
                toast({
                  title: "Success",
                  description: "Note updated successfully",
                  duration: 2000,
                });
              } catch (error: any) {
                console.error("Error updating note:", error);
                toast({
                  title: "Error",
                  description: error.message || "Failed to update note",
                  variant: "destructive",
                  duration: 2000,
                });
              }
            }}
            isProcessing={isProcessing}
          />

          <DeleteNoteModal
            isOpen={isDeleteNoteModalOpen}
            onClose={() => {
              setIsDeleteNoteModalOpen(false);
              setSelectedNote(null);
            }}
            onDelete={async () => {
              try {
                const response = await fetch(`/api/notes/${selectedNote.id}`, {
                  method: "DELETE",
                });

                if (!response.ok) {
                  throw new Error("Failed to delete note");
                }

                await fetchNotes();
                setIsDeleteNoteModalOpen(false);
                setSelectedNote(null);
                toast({
                  title: "Success",
                  description: "Note deleted successfully",
                  duration: 2000,
                });
              } catch (error: any) {
                console.error("Error deleting note:", error);
                toast({
                  title: "Error",
                  description: error.message || "Failed to delete note",
                  variant: "destructive",
                  duration: 2000,
                });
              }
            }}
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
