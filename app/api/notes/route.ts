import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Get current time in UTC
    const now = new Date();
    // Subtract 8 hours to get Pacific time
    const pacificTime = new Date(now.getTime() - 8 * 60 * 60 * 1000);

    const note = await prisma.note.create({
      data: {
        content,
        created_at: pacificTime,
        updated_at: pacificTime,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create note" },
      { status: 500 }
    );
  }
}
