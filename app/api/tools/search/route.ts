import { NextResponse } from "next/server";
import { searchTools } from "@/lib/meilisearch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const filters = searchParams.get("filters");

    const results = await searchTools(query, filters || undefined);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
