import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTool } from "@/lib/utils";

export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    // Convert BigInt IDs to strings for JSON serialization
    const serializedTools = tools.map((tool) => ({
      ...tool,
      id: tool.id.toString(),
    }));

    return NextResponse.json(serializedTools);
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { error: "Failed to fetch tools" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { url, title, description, tags, is_personal_tool } =
      await request.json();

    if (!url || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tool = await prisma.tool.create({
      data: {
        title,
        link: url, // Map url to link for database
        description,
        tags,
        is_personal_tool,
        updated_at: new Date(),
      },
    });

    // Convert BigInt ID to string for JSON serialization
    return NextResponse.json({
      ...tool,
      id: tool.id.toString(),
    });
  } catch (error) {
    console.error("Error creating tool:", error);
    return NextResponse.json(
      { error: "Failed to create tool" },
      { status: 500 }
    );
  }
}
