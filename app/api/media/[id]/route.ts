import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, url, description, type, comment } = await request.json();

    if (!url || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For tweets, we don't require a title
    if (!title && type !== "tweet") {
      return NextResponse.json(
        { error: "Title is required for non-tweet media items" },
        { status: 400 }
      );
    }

    // Use a default title for tweets if not provided
    const finalTitle = title || (type === "tweet" ? "Tweet" : "");

    const updatedMedia = await prisma.mediaItem.update({
      where: { id: params.id },
      data: {
        title: finalTitle,
        url,
        description,
        type,
        comment,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedMedia);
  } catch (error) {
    console.error("Error updating media item:", error);
    return NextResponse.json(
      { error: "Failed to update media item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.mediaItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media item:", error);
    return NextResponse.json(
      { error: "Failed to delete media item" },
      { status: 500 }
    );
  }
}
