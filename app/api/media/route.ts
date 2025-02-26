import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { load } from "cheerio";
import { getCurrentPacificDate } from "@/utils/date";

const VALID_TYPES = ["article", "tweet", "youtube", "other"] as const;
type MediaType = (typeof VALID_TYPES)[number];

function detectMediaType(url: string): MediaType {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return "tweet";
    } else if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be")
    ) {
      return "youtube";
    } else {
      return "article";
    }
  } catch {
    return "other";
  }
}

async function fetchAndSummarizeContent(
  url: string,
  type: MediaType
): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);

    let content = "";
    switch (type) {
      case "article":
        // Try to get the main content
        content = $("article, main, .content, .post-content, .article-content")
          .first()
          .text()
          .trim();
        // Fallback to body if no main content found
        if (!content) {
          content = $("body").text().trim();
        }
        break;
      case "tweet":
        // For tweets, use the tweet text
        content = $("[data-testid='tweetText']").text().trim();
        break;
      case "youtube":
        // For YouTube, use the video description
        content = $("meta[name='description']").attr("content") || "";
        break;
      default:
        content = $("body").text().trim();
    }

    if (!content) {
      return "";
    }

    // Use the dedicated summarize endpoint with the full URL
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = process.env.VERCEL_URL || "localhost:3000";
    const summaryResponse = await fetch(
      `${protocol}://${host}/api/media/summarize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, type }),
      }
    );

    if (!summaryResponse.ok) {
      throw new Error(
        `Failed to summarize content: ${summaryResponse.statusText}`
      );
    }

    const { summary } = await summaryResponse.json();
    return (
      summary ||
      (content.length > 500 ? `${content.substring(0, 500)}...` : content)
    );
  } catch (error) {
    console.error("Error fetching or summarizing content:", error);
    return ""; // Return empty string if fetching fails
  }
}

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
        comment: true,
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
      type: providedType,
      embedHtml,
      videoId: providedVideoId,
      comment,
    } = await request.json();

    // Validate input - title is only required for non-tweet types
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Detect media type from URL if not provided or validate provided type
    const detectedType = detectMediaType(url);
    const type =
      providedType && VALID_TYPES.includes(providedType as MediaType)
        ? providedType
        : detectedType;

    // For tweets, we don't require a title
    if (!title && type !== "tweet") {
      return NextResponse.json(
        { error: "Title is required for non-tweet media items" },
        { status: 400 }
      );
    }

    // Use a default title for tweets if not provided
    const finalTitle = title || (type === "tweet" ? "Tweet" : "");

    // Extract video ID for YouTube URLs
    let finalVideoId = providedVideoId;
    if (type === "youtube" && !finalVideoId) {
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

    // Generate summary if no description provided and not a tweet
    let finalDescription = description;
    if (!finalDescription && type === "article") {
      const content = await fetchAndSummarizeContent(url, type as MediaType);
      finalDescription = content;
    }

    // Create the media item with Pacific timezone
    const now = new Date();
    // Subtract 8 hours to get Pacific time
    const pacificTime = new Date(now.getTime() - 8 * 60 * 60 * 1000);

    const mediaItem = await prisma.mediaItem.create({
      data: {
        title: finalTitle,
        url,
        description: type === "article" ? finalDescription : "",
        type,
        embed_html: embedHtml,
        video_id: finalVideoId,
        comment,
        created_at: pacificTime,
        updated_at: pacificTime,
      },
    });

    return NextResponse.json(mediaItem);
  } catch (error: any) {
    console.error("Error creating media item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create media item" },
      { status: 500 }
    );
  }
}
