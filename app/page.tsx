"use client";

import { useState, useEffect } from "react";
import { Tool } from "../types/tool";
import ToolItem from "./components/ToolItem";
import { AddToolModal } from "./components/AddToolModal";
import { LoginModal } from "./components/LoginModal";
import { supabase, fetchWithRetry } from "../utils/supabase";
import { getCurrentUser, isAdmin, signOut } from "../utils/auth";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    fetchTools();
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
            AI Arsenal 🤖🛠️
          </h1>
          <p className="text-gray-600 mt-1">Total Tools: {tools.length}</p>
        </div>
        <div className="flex gap-2">
          {user ? (
            <>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Tool
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

      <div>
        {tools.map((tool) => (
          <ToolItem
            key={tool.id}
            tool={tool}
            onDelete={deleteTool}
            onEdit={editTool}
            isAdmin={isUserAdmin}
          />
        ))}
      </div>

      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTool={handleAddTool}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          checkUser();
        }}
      />
    </main>
  );
}
