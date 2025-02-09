import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase-server";

export async function GET() {
  const supabase = createServerClient();

  try {
    const { data: prompts, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { title, content, type } = await req.json();

    // Validate input
    if (!title || !content || !type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["operator", "regular"].includes(type)) {
      return Response.json(
        { error: "Type must be either 'operator' or 'regular'" },
        { status: 400 }
      );
    }

    // Log the incoming data
    console.log("Creating prompt with data:", { title, content, type });

    const prompt = await prisma.prompt.create({
      data: {
        title,
        content,
        type,
        user_id: "00000000-0000-0000-0000-000000000000", // Default user ID for now
      },
    });

    // Log successful creation
    console.log("Prompt created successfully:", prompt);

    return Response.json(prompt);
  } catch (error: any) {
    // Log the detailed error
    console.error("Error creating prompt:", error);

    return Response.json(
      {
        error: "Failed to create prompt",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
