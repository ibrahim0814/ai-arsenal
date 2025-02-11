import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const media = await prisma.mediaItem.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        type: true,
        embed_html: true,
        video_id: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Transform the response to match the frontend interface
    const transformedMedia = media.map((item) => ({
      ...item,
      videoId: item.video_id,
      embedHtml: item.embed_html,
    }));

    return NextResponse.json(transformedMedia);
  } catch (error) {
    console.error("Error fetching media items:", error);
    return NextResponse.json(
      { error: "Failed to fetch media items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      title,
      url,
      description,
      type,
      embedHtml,
      videoId: providedVideoId,
    } = await request.json();

    // Validate input
    if (!title || !url || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract video ID for YouTube URLs if not provided
    let finalVideoId = providedVideoId;
    if (type.toLowerCase() === "youtube" && !finalVideoId) {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has("v")) {
        finalVideoId = urlObj.searchParams.get("v");
      } else {
        // Handle youtu.be format
        const pathSegments = urlObj.pathname.split("/");
        finalVideoId = pathSegments[pathSegments.length - 1];
      }
      // Remove any additional parameters (like timestamp)
      finalVideoId = finalVideoId?.split("&")[0];
    }

    // Normalize type to lowercase
    const validTypes = ["article", "tweet", "youtube", "other"];
    const normalizedType = type.toLowerCase();

    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json(
        {
          error: `Invalid type. Must be one of: article, tweet, youtube, other`,
        },
        { status: 400 }
      );
    }

    // Log the incoming data
    console.log("Creating media item with data:", {
      title,
      url,
      description,
      type: normalizedType,
      embedHtml,
      videoId: finalVideoId,
    });

    const mediaItem = await prisma.mediaItem.create({
      data: {
        title,
        url,
        description: description || title, // Use title as fallback description
        type: normalizedType,
        embed_html: embedHtml,
        video_id: finalVideoId,
        updated_at: new Date(),
      },
    });

    // Log successful creation
    console.log("Media item created successfully:", mediaItem);

    return NextResponse.json(mediaItem);
  } catch (error: any) {
    // Log the detailed error
    console.error("Error creating media item:", error);

    return NextResponse.json(
      {
        error: "Failed to create media item",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
