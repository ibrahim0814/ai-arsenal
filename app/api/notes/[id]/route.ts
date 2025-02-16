import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.note.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      {
        error: "Failed to delete note",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const pacificTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    );

    const note = await prisma.note.update({
      where: {
        id: params.id,
      },
      data: {
        content,
        updated_at: pacificTime,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      {
        error: "Failed to update note",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
