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
import OpenAI from "openai";
import * as cheerio from "cheerio";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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

  async function addTool(link: string) {
    if (!isUserAdmin) {
      throw new Error("Only admins can add tools.");
    }
    try {
      // Validate and fetch the webpage content
      let url;
      try {
        url = new URL(link);
      } catch (error) {
        throw new Error(
          "Invalid URL. Please enter a valid URL including the protocol (e.g., https://)."
        );
      }

      const response = await fetch(url.href);
      if (!response.ok) {
        throw new Error(`Failed to fetch the webpage: ${response.statusText}`);
      }
      const html = await response.text();

      // Use cheerio to parse the HTML and extract relevant content
      let $;
      try {
        const $ = cheerio.load(html);
      } catch (err) {
        console.log(err);
      }

      // Extract text content from relevant elements
      const title = $("title").text().trim();
      const metaDescription =
        $('meta[name="description"]').attr("content")?.trim() || "";
      const h1Text = $("h1").text().trim();
      const mainContent = ($("main").text() || $("body").text()).trim();

      // Prepare content for AI processing
      const contentForAI = `
        Title: ${title}
        Description: ${metaDescription}
        Heading: ${h1Text}
        Content: ${mainContent.substring(0, 1500)}
      `.trim();

      // Generate summary using AI
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a tool that generates concise names and descriptions for AI tools and companies. Respond with exactly two lines: first line is the name, second line is a brief description focusing on the tool's main purpose and features.",
          },
          {
            role: "user",
            content: `Based on this webpage content, grab the name of the company and write a brief description:\n\n${contentForAI}`,
          },
        ],
        model: "gpt-3.5-turbo",
        max_tokens: 100,
        temperature: 0.7,
      });

      const generatedText = completion.choices[0]?.message?.content || "";
      const [name, ...descriptionParts] = generatedText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const description = descriptionParts.join(" ").trim();

      if (!name || !description) {
        throw new Error("Failed to generate name or description");
      }

      // Add tool to database
      const { data: toolData, error: dbError } = await fetchWithRetry(
        async () =>
          await supabase
            .from("tools")
            .insert([
              {
                title: name,
                link,
                description: description,
              },
            ])
            .select()
      );

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error(dbError.message || "Failed to add tool to database");
      }

      if (toolData) {
        setTools([toolData[0], ...tools]);
      } else {
        throw new Error("No data returned from database insertion");
      }
    } catch (error: any) {
      console.error("Error adding tool:", error);
      throw new Error(error.message || "Failed to add tool. Please try again.");
    }
  }

  async function editTool(
    id: string,
    title: string,
    link: string,
    description: string
  ) {
    if (!isUserAdmin) {
      setError("Only admins can edit tools.");
      return;
    }
    try {
      const { data, error } = await fetchWithRetry(
        async () =>
          await supabase
            .from("tools")
            .update({ title, link, description })
            .eq("id", id)
            .select()
      );

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      if (data) {
        setTools(tools.map((tool) => (tool.id === id ? data[0] : tool)));
      }
    } catch (error) {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Tools Aggregator</h1>
        <div className="space-x-2">
          {isUserAdmin ? (
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
      <ul className="space-y-4">
        {tools.map((tool) => (
          <ToolItem
            key={tool.id}
            tool={tool}
            onDelete={deleteTool}
            onEdit={editTool}
            isAdmin={isUserAdmin}
          />
        ))}
      </ul>
      <AddToolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTool={addTool}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          checkUser();
        }}
      />
    </div>
  );
}
