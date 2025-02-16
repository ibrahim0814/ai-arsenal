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

    // Create the note with Pacific timezone
    const now = new Date();
    const pacificTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );

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
      {
        error: "Failed to create note",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
