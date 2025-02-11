import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, link, description, tags, is_personal_tool } =
      await request.json();

    if (!title || !link || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedTool = await prisma.tool.update({
      where: { id: BigInt(params.id) },
      data: {
        title,
        link,
        description,
        tags,
        is_personal_tool,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      ...updatedTool,
      id: updatedTool.id.toString(),
    });
  } catch (error) {
    console.error("Error updating tool:", error);
    return NextResponse.json(
      { error: "Failed to update tool" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tool.delete({
      where: { id: BigInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tool:", error);
    return NextResponse.json(
      { error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
