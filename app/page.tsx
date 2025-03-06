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
import { toPacificDate } from "@/utils/date";

// Lazy load modals and other non-critical components
const LoginModal = lazy(() =>
  import("./components/LoginModal").then((mod) => ({ default: mod.LoginModal }))
);
const AddToolModal = lazy(() =>
  import("./components/tools/AddToolModal").then((mod) => ({
    default: mod.AddToolModal,
  }))
);
const AddEditPromptModal = lazy(() =>
  import("./components/prompts/AddEditPromptModal").then((mod) => ({
    default: mod.AddEditPromptModal,
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
const AddEditNoteModal = lazy(() =>
  import("./components/media/AddEditNoteModal").then((mod) => ({
    default: mod.AddEditNoteModal,
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetTab, setTargetTab] = useState<string>("tools");
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
      const fetchWithTimeout = async (url: string, timeout = 5000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        } catch (error: any) {
          if (error.name === "AbortError") {
            throw new Error("Request timed out");
          }
          throw error;
        }
      };

      const results = await Promise.allSettled([
        fetchWithTimeout("/api/tools"),
        fetchWithTimeout("/api/prompts"),
        fetchWithTimeout("/api/media"),
      ]);

      // Process results, using empty arrays for any failed requests
      const [toolsResult, promptsResult, mediaResult] = results;

      setTools(toolsResult.status === "fulfilled" ? toolsResult.value : []);
      setPrompts(
        promptsResult.status === "fulfilled" ? promptsResult.value : []
      );
      setMediaItems(
        mediaResult.status === "fulfilled" ? mediaResult.value : []
      );

      // Show error toast if any requests failed
      const failedRequests = results.filter((r) => r.status === "rejected");
      if (failedRequests.length > 0) {
        toast({
          title: "Some data failed to load",
          description: "Try refreshing the page.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching public data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }

  async function fetchNotes() {
    setNotesLoading(true);
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
    } finally {
      setNotesLoading(false);
    }
  }

  // Initial data load with optimized loading sequence and auth caching
  useEffect(() => {
    const initializeApp = async () => {
      // Always start with loading true, even when logged out
      setLoading(true);
      let isUserAuthenticating = false;

      // Check for early auth data from the script in layout.tsx
      try {
        // @ts-ignore - This is set by the script in layout.tsx
        const cachedAuth = window.__ARSENAL_CACHED_AUTH;
        if (cachedAuth) {
          setUser(cachedAuth.user);
          setIsUserAdmin(cachedAuth.isAdmin);

          // If we have user auth already, show notes sidebar skeleton immediately
          if (cachedAuth.user) {
            isUserAuthenticating = true; // We have a user and are loading data
            setIsAuthenticating(true); // Set authenticating flag when verifying cached credentials
            setNotesLoading(true); // Show notes loading state immediately

            // Start notes fetch immediately
            fetchNotes().catch((err) =>
              console.error("Error prefetching notes:", err)
            );
          }
        }
      } catch (e) {
        console.warn("Failed to access cached auth data", e);
      }

      // First check for cached data to immediately populate UI
      const cachedTools = localStorage.getItem("cached_tools");
      const cachedPrompts = localStorage.getItem("cached_prompts");
      const cachedMedia = localStorage.getItem("cached_media");
      const cacheTimestamp = localStorage.getItem("cache_timestamp");

      // Use cached data if it exists and is less than 5 minutes old
      const isCacheValid =
        cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < 5 * 60 * 1000;

      if (isCacheValid) {
        if (cachedTools) setTools(JSON.parse(cachedTools));
        if (cachedPrompts) setPrompts(JSON.parse(cachedPrompts));
        if (cachedMedia) setMediaItems(JSON.parse(cachedMedia));
      }

      try {
        // Load all data in parallel but handle them as they complete
        const toolsPromise = fetch("/api/tools");
        const promptsPromise = fetch("/api/prompts");
        const mediaPromise = fetch("/api/media");

        // Only fetch user if we don't already have it from cache
        // @ts-ignore - This is set by the script in layout.tsx
        const userPromise = !window.__ARSENAL_CACHED_AUTH
          ? getCurrentUser()
          : Promise.resolve(null);

        // Handle tools response as soon as it arrives (highest priority)
        toolsPromise
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error("Failed to fetch tools");
          })
          .then((toolsData) => {
            setTools(toolsData);
            // Update cache
            localStorage.setItem("cached_tools", JSON.stringify(toolsData));
            localStorage.setItem("cache_timestamp", Date.now().toString());

            // Clear loading state once we have data
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching tools:", error);
            // Only show toast if we don't have cached data
            if (!cachedTools) {
              toast({
                title: "Error",
                description:
                  "Failed to load tools. Using cached data if available.",
                variant: "destructive",
              });
            }
            // Even on error, clear loading state
            setLoading(false);
          });

        // Handle user auth in parallel only if we didn't get it from cache
        // @ts-ignore - This is set by the script in layout.tsx
        if (!window.__ARSENAL_CACHED_AUTH) {
          userPromise
            .then((currentUser) => {
              if (currentUser) {
                setUser(currentUser);
                // Once we have user, check admin status and fetch notes
                return Promise.all([isAdmin(currentUser), fetchNotes()]);
              }
              return null;
            })
            .then((results) => {
              if (results) {
                const [adminStatus] = results;
                setIsUserAdmin(adminStatus);
              }
              // Remove artificial delay to make skeleton disappear immediately
              setLoading(false);
              setIsAuthenticating(false); // Clear authenticating flag when done
            })
            .catch((error) => {
              console.error("Error checking user:", error);
              setLoading(false);
              setIsAuthenticating(false); // Clear authenticating flag on error
            });
        } else {
          // Remove artificial delay to make skeleton disappear immediately
          setLoading(false);
          setIsAuthenticating(false); // Clear authenticating flag when not logged in
        }

        // Handle prompts and media responses (lower priority)
        promptsPromise
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error("Failed to fetch prompts");
          })
          .then((promptsData) => {
            setPrompts(promptsData);
            localStorage.setItem("cached_prompts", JSON.stringify(promptsData));
          })
          .catch((error) => {
            console.error("Error fetching prompts:", error);
          });

        mediaPromise
          .then((response) => {
            if (response.ok) return response.json();
            throw new Error("Failed to fetch media");
          })
          .then((mediaData) => {
            setMediaItems(mediaData);
            localStorage.setItem("cached_media", JSON.stringify(mediaData));
          })
          .catch((error) => {
            console.error("Error fetching media:", error);
          });
      } catch (error) {
        console.error("Error in initial load:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    };

    initializeApp();
  }, []);

  // Check authentication state on mount - optimized to use cached data
  useEffect(() => {
    const checkAuthState = async () => {
      // Immediately show notes loading state if we have cached auth
      try {
        // @ts-ignore - This is set by the script in layout.tsx
        if (window.__ARSENAL_CACHED_AUTH?.user) {
          setNotesLoading(true);
          setIsAuthenticating(true);
        }
      } catch (e) {
        console.warn("Failed to check cached auth for notes loading", e);
      }

      // We don't need to show loading state here since auth check will be fast with caching
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        // isAdmin is now also cached, so this call will be fast
        const adminStatus = await isAdmin(currentUser);
        setIsUserAdmin(adminStatus);

        // If we found a user but didn't already trigger notes loading, do it now
        setNotesLoading(true);
        await fetchNotes();
      }

      // Clear authenticating flag
      setIsAuthenticating(false);
    };
    checkAuthState();
  }, []);

  async function checkUser() {
    setLoading(true); // Set loading state during auth check
    setIsAuthenticating(true); // Set authenticating flag during credential verification
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const adminStatus = await isAdmin(currentUser);
        setIsUserAdmin(adminStatus);
        await fetchNotes();
      } else {
        setNotes([]);
      }
    } finally {
      setLoading(false); // Clear loading state
      setIsAuthenticating(false); // Clear authenticating flag when verification completes
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
      setActiveTab("tools");
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
      setActiveTab("prompts");
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
    type: string,
    comment?: string
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
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add media item");
      }

      setIsAddModalOpen(false);
      await fetchPublicData();
      setActiveTab("media");
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
    type: string,
    comment?: string
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
          comment,
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

  // We don't show a full-page loading spinner anymore
  // Instead, we render the UI shell immediately and show spinners for content areas

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
          setTargetTab(tab);
          setIsAddModalOpen(true);
        }}
        onOpenAddNote={() => setIsAddNoteModalOpen(true)}
        isLoading={loading || isAuthenticating}
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
          isLoading={loading || isAuthenticating}
          toolsLoading={loading || isAuthenticating}
          promptsLoading={loading || isAuthenticating}
          mediaLoading={loading || isAuthenticating}
          isAuthenticating={isAuthenticating}
        />

        {/* Only render notes sidebar when user is authenticated or during authentication process */}
        {(user || isAuthenticating) && (
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
            isLoading={notesLoading || loading || isAuthenticating}
          />
        )}
      </div>

      {/* Preload critical action modals */}
      <div style={{ display: "none" }}>
        <Suspense fallback={null}>
          <AddToolModal
            open={false}
            onClose={() => {}}
            onAdd={() => Promise.resolve()}
          />
          <AddEditNoteModal
            isOpen={false}
            onClose={() => {}}
            onSubmit={() => Promise.resolve()}
            isProcessing={false}
            mode="add"
          />
        </Suspense>
      </div>

      {/* Render modals dynamically when needed */}
      {isLoginModalOpen && (
        <LoginModal
          open={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={async () => {
            setLoading(true); // Show skeleton loaders during auth
            setIsAuthenticating(true); // Set authenticating flag when login attempt starts
            setNotesLoading(true); // Show notes loading immediately

            try {
              const currentUser = await getCurrentUser();
              setUser(currentUser);
              if (currentUser) {
                const adminStatus = await isAdmin(currentUser);
                setIsUserAdmin(adminStatus);
                await fetchNotes();
              }
            } finally {
              setLoading(false);
              setIsAuthenticating(false); // Clear authenticating flag when login completes
              setIsLoginModalOpen(false);
            }
          }}
        />
      )}

      {isAddModalOpen && targetTab === "tools" && (
        <AddToolModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTool}
        />
      )}

      {isAddModalOpen && targetTab === "prompts" && (
        <AddEditPromptModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddPrompt}
          mode="add"
          isProcessing={isProcessing}
        />
      )}

      {isAddModalOpen && targetTab === "media" && (
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
        <AddEditPromptModal
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
        <AddEditNoteModal
          isOpen={isAddNoteModalOpen}
          onClose={() => setIsAddNoteModalOpen(false)}
          onSubmit={handleAddNote}
          isProcessing={isProcessing}
          mode="add"
        />
      )}

      {selectedNote && isEditNoteModalOpen && (
        <AddEditNoteModal
          isOpen={isEditNoteModalOpen}
          onClose={() => {
            setIsEditNoteModalOpen(false);
            setSelectedNote(null);
          }}
          onSubmit={handleEditNote}
          initialContent={selectedNote.content}
          isProcessing={processingIds[selectedNote.id]}
          mode="edit"
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
    </div>
  );
}
