import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const data = await request.json();
    const tool = await prisma.tool.create({
      data: {
        link: data.url,
        title: data.title,
        description: data.description,
        tags: data.tags,
        is_personal_tool: data.is_personal_tool,
      },
    });

    const serializedTool = {
      ...tool,
      id: tool.id.toString(),
    };

    return NextResponse.json(serializedTool);
  } catch (error) {
    console.error("Error creating tool:", error);
    return NextResponse.json(
      { error: "Failed to create tool" },
      { status: 500 }
    );
  }
}
