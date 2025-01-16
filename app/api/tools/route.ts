import { prisma } from "@/lib/prisma";
import { serializeTool } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, title, description, tags, is_personal_tool } = body;

    // Validate input
    if (!url || !title || !description) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the incoming data
    console.log("Creating tool with data:", {
      link: url,
      title,
      description,
      tags,
      is_personal_tool,
    });

    const tool = await prisma.tool.create({
      data: {
        link: url,
        title,
        description,
        tags,
        is_personal_tool,
      },
    });

    // Log successful creation
    console.log("Tool created successfully:", tool);

    // Serialize the tool before sending response
    const serializedTool = serializeTool(tool);
    return Response.json(serializedTool);
  } catch (error: any) {
    // Log the detailed error
    console.error("Error creating tool:", error);

    return Response.json(
      {
        error: "Failed to create tool",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
