"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { Tool, Prompt, MediaItem, Note } from "@/types";
import { getCurrentUser, isAdmin, signOut } from "../utils/auth";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "./components/Header";
import { MainContent } from "./components/MainContent";
import { NotesSidebar } from "./components/NotesSidebar";
import { indexTools } from "@/lib/meilisearch";
import { toPacificDate } from "@/utils/date";
import { LoadingSpinner } from "./components/LoadingSpinner";

// Lazy load modals and other non-critical components
const LoginModal = lazy(() =>
  import("./components/LoginModal").then((mod) => ({ default: mod.LoginModal }))
);
const AddToolModal = lazy(() =>
  import("./components/tools/AddToolModal").then((mod) => ({
    default: mod.AddToolModal,
  }))
);
const PromptFormModal = lazy(() =>
  import("./components/prompts/PromptFormModal").then((mod) => ({
    default: mod.PromptFormModal,
  }))
);
const DeletePromptModal = lazy(() =>
  import("./components/prompts/DeletePromptModal").then((mod) => ({
    default: mod.DeletePromptModal,
  }))
);
const AddMediaModal = lazy(() =>
  import("./components/media/AddMediaModal").then((mod) => ({
    default: mod.AddMediaModal,
  }))
);
const DeleteMediaModal = lazy(() =>
  import("./components/media/DeleteMediaModal").then((mod) => ({
    default: mod.DeleteMediaModal,
  }))
);
const AddNoteModal = lazy(() =>
  import("./components/media/AddNoteModal").then((mod) => ({
    default: mod.AddNoteModal,
  }))
);
const EditNoteModal = lazy(() =>
  import("./components/media/EditNoteModal").then((mod) => ({
    default: mod.EditNoteModal,
  }))
);
const DeleteNoteModal = lazy(() =>
  import("./components/media/DeleteNoteModal").then((mod) => ({
    default: mod.DeleteNoteModal,
  }))
);

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
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

  async function fetchPublicData() {
    try {
      const [toolsData, promptsData, mediaData] = await Promise.all([
        fetch("/api/tools").then((res) => res.json()),
        fetch("/api/prompts").then((res) => res.json()),
        fetch("/api/media").then((res) => res.json()),
      ]);

      setTools(toolsData || []);
      setPrompts(promptsData || []);
      setMediaItems(mediaData || []);
    } catch (error) {
      console.error("Error fetching public data:", error);
      setError(
        "Failed to fetch data. Please check your connection and try again."
      );
    }
  }

  async function fetchNotes() {
    try {
      const response = await fetch("/api/notes");
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      setNotes(
        (data || []).map((note: any) => ({ ...note, type: "note" as const }))
      );
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }

  // Initial data load
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        await fetchPublicData();
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const adminStatus = await isAdmin(currentUser);
          setIsUserAdmin(adminStatus);
          await fetchNotes();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
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
      await fetchNotes();
    } else {
      setNotes([]);
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
      await fetchPublicData();
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
      await fetchPublicData();
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
      await fetchPublicData();
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

  async function handleAddMediaItem(
    title: string,
    url: string,
    description: string,
    type: string
  ) {
    setIsProcessing(true);
    try {
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
      await fetchPublicData();
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
      await fetchPublicData();
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
      await fetchPublicData();
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

    const addToGroup = (item: MediaItem | Note) => {
      const date = toPacificDate(item.created_at);
      const dateKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Los_Angeles",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    };

    mediaItems.forEach(addToGroup);
    notes
      .map((note) => ({ ...note, type: "note" as const }))
      .forEach(addToGroup);

    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .sort(([dateA], [dateB]) => {
        const dateAObj = toPacificDate(groups[dateA][0].created_at);
        const dateBObj = toPacificDate(groups[dateB][0].created_at);
        return dateBObj.getTime() - dateAObj.getTime();
      })
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => {
          const dateA = toPacificDate(a.created_at);
          const dateB = toPacificDate(b.created_at);
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

  async function handleEditNote(content: string) {
    if (!selectedNote) return;

    setProcessingIds((prev) => ({ ...prev, [selectedNote.id]: true }));
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
    } finally {
      if (selectedNote) {
        setProcessingIds((prev) => ({ ...prev, [selectedNote.id]: false }));
      }
    }
  }

  async function handleDeleteNote() {
    if (!selectedNote) return;

    setProcessingIds((prev) => ({ ...prev, [selectedNote.id]: true }));
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
    } finally {
      if (selectedNote) {
        setProcessingIds((prev) => ({ ...prev, [selectedNote.id]: false }));
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-100 dark:bg-gray-950">
      <Header
        isUserAdmin={isUserAdmin}
        user={user}
        onSignOut={handleSignOut}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAddModal={(tab) => {
          setActiveTab(tab);
          setIsAddModalOpen(true);
        }}
        onOpenAddNote={() => setIsAddNoteModalOpen(true)}
      />

      <div className="flex gap-8 mt-8">
        <MainContent
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tools={tools}
          prompts={prompts}
          mediaItems={mediaItems}
          notes={notes}
          searchResults={searchResults}
          isSearching={isSearching}
          processingIds={processingIds}
          isAdmin={isUserAdmin}
          user={user}
          onSearch={handleSearch}
          onEditTool={editTool}
          onDeleteTool={deleteTool}
          onEditPrompt={(prompt) => {
            setSelectedPrompt(prompt);
            setIsEditModalOpen(true);
          }}
          onDeletePrompt={(prompt) => {
            setSelectedPrompt(prompt);
            setIsDeleteModalOpen(true);
          }}
          onEditMedia={(item) => {
            setSelectedMediaItem(item);
            setIsMediaModalOpen(true);
          }}
          onDeleteMedia={(id) => {
            const item = mediaItems.find((m) => m.id === id);
            if (item) {
              setSelectedMediaItem(item);
              setIsDeleteMediaModalOpen(true);
            }
          }}
          onEditNote={(note) => {
            setSelectedNote(note);
            setIsEditNoteModalOpen(true);
          }}
          onDeleteNote={(id) => {
            const note = notes.find((n) => n.id === id);
            if (note) {
              setSelectedNote(note);
              setIsDeleteNoteModalOpen(true);
            }
          }}
          groupContentByDate={groupContentByDate}
          isLoading={loading}
          toolsLoading={loading}
          promptsLoading={loading}
          mediaLoading={loading}
        />

        {user && (
          <NotesSidebar
            notes={notes}
            isAdmin={isUserAdmin}
            onEditNote={(note) => {
              setSelectedNote(note);
              setIsEditNoteModalOpen(true);
            }}
            onDeleteNote={(id) => {
              const note = notes.find((n) => n.id === id);
              if (note) {
                setSelectedNote(note);
                setIsDeleteNoteModalOpen(true);
              }
            }}
            isLoading={contentLoading}
          />
        )}
      </div>

      <Suspense fallback={null}>
        {isLoginModalOpen && (
          <LoginModal
            open={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={async () => {
              setContentLoading(true);
              try {
                await checkUser();
                await fetchNotes();
              } finally {
                setContentLoading(false);
                setIsLoginModalOpen(false);
              }
            }}
          />
        )}

        {isAddModalOpen && activeTab === "tools" && (
          <AddToolModal
            open={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddTool}
          />
        )}

        {isAddModalOpen && activeTab === "prompts" && (
          <PromptFormModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddPrompt}
            mode="add"
            isProcessing={isProcessing}
          />
        )}

        {isAddModalOpen && activeTab === "media" && (
          <AddMediaModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddMediaItem}
            initialData={null}
            mode="add"
            isProcessing={isProcessing}
          />
        )}

        {selectedPrompt && isEditModalOpen && (
          <PromptFormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPrompt(null);
            }}
            onSubmit={handleEditPrompt}
            mode="edit"
            initialData={selectedPrompt}
            isProcessing={isProcessing}
          />
        )}

        {selectedPrompt && isDeleteModalOpen && (
          <DeletePromptModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPrompt(null);
            }}
            onDelete={handleDeletePrompt}
            prompt={selectedPrompt}
            isProcessing={processingIds[selectedPrompt.id]}
          />
        )}

        {selectedMediaItem && isMediaModalOpen && (
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
        )}

        {selectedMediaItem && isDeleteMediaModalOpen && (
          <DeleteMediaModal
            isOpen={isDeleteMediaModalOpen}
            onClose={() => {
              setIsDeleteMediaModalOpen(false);
              setSelectedMediaItem(null);
            }}
            onDelete={handleDeleteMediaItem}
            item={selectedMediaItem}
            isProcessing={processingIds[selectedMediaItem.id]}
          />
        )}

        {isAddNoteModalOpen && (
          <AddNoteModal
            isOpen={isAddNoteModalOpen}
            onClose={() => setIsAddNoteModalOpen(false)}
            onSubmit={handleAddNote}
            isProcessing={isProcessing}
          />
        )}

        {selectedNote && isEditNoteModalOpen && (
          <EditNoteModal
            isOpen={isEditNoteModalOpen}
            onClose={() => {
              setIsEditNoteModalOpen(false);
              setSelectedNote(null);
            }}
            onSubmit={handleEditNote}
            initialContent={selectedNote.content}
            isProcessing={processingIds[selectedNote.id]}
          />
        )}

        {selectedNote && isDeleteNoteModalOpen && (
          <DeleteNoteModal
            isOpen={isDeleteNoteModalOpen}
            onClose={() => {
              setIsDeleteNoteModalOpen(false);
              setSelectedNote(null);
            }}
            onDelete={handleDeleteNote}
            isProcessing={processingIds[selectedNote.id]}
          />
        )}
      </Suspense>
    </div>
  );
}
