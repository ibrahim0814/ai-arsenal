import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ hits: [] });
  }

  try {
    // Convert the query to a tsquery format
    const searchQuery = query
      .trim()
      .split(/\s+/)
      .map((term) => `${term}:*`)
      .join(" & ");

    // Use raw SQL for proper full-text search
    const tools = await prisma.$queryRaw`
      SELECT id, title, link, description, tags, is_personal_tool, created_at, updated_at,
             ts_rank(search_vector, to_tsquery('english', ${searchQuery})) as rank
      FROM tools
      WHERE search_vector @@ to_tsquery('english', ${searchQuery})
      ORDER BY rank DESC, created_at DESC
      LIMIT 50
    `;

    // Convert BigInt IDs to strings for JSON serialization
    const serializedTools = (tools as any[]).map((tool) => ({
      ...tool,
      id: tool.id.toString(),
      // Convert BigInt to number for rank
      rank: Number(tool.rank),
    }));

    return NextResponse.json({ hits: serializedTools });
  } catch (error) {
    console.error("Error searching tools:", error);
    return NextResponse.json(
      { error: "Failed to search tools" },
      { status: 500 }
    );
  }
}
