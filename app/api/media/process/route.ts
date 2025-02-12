import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import * as cheerio from "cheerio";
import { load } from "cheerio";

function isTweetUrl(url: string): boolean {
  return url.match(/^https?:\/\/(.*\.)?(twitter\.com|x\.com)\//) !== null;
}

function isYouTubeUrl(url: string): boolean {
  return (
    url.match(/^https?:\/\/(.*\.)?youtube\.com\/|^https?:\/\/youtu\.be\//) !==
    null
  );
}

function getYouTubeVideoId(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

async function generateSummary(content: string, type: string): Promise<string> {
  // For now, return a simple summary based on the content
  // In a real implementation, this would call an LLM API
  switch (type) {
    case "article":
      return content.length > 200 ? content.substring(0, 200) + "..." : content;
    case "tweet":
      return content;
    case "youtube":
      return content.length > 150 ? content.substring(0, 150) + "..." : content;
    default:
      return content.length > 200 ? content.substring(0, 200) + "..." : content;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // Detect type from URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    let type = "article";
    let videoId = null;

    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      type = "tweet";
    } else if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be")
    ) {
      type = "youtube";
      // Extract video ID
      if (urlObj.searchParams.has("v")) {
        videoId = urlObj.searchParams.get("v");
      } else {
        // Handle youtu.be format
        const pathSegments = urlObj.pathname.split("/");
        videoId = pathSegments[pathSegments.length - 1];
      }
      // Remove any additional parameters (like timestamp)
      videoId = videoId?.split("&")[0];
    }

    // Fetch the webpage content
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);

    // Get title
    let title =
      $("meta[property='og:title']").attr("content") ||
      $("meta[name='twitter:title']").attr("content") ||
      $("title").text();

    // Clean up title
    title = title
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\|\s*.*$/, "")
      .replace(/\s*[-–]\s*[^-–]*$/, "");

    // Get content based on type
    let content = "";
    let description = "";
    switch (type) {
      case "article":
        // First try to get the article content from common article containers
        content = $(
          "article, [role='article'], .article-content, .post-content, .entry-content, main article"
        )
          .first()
          .text()
          .trim();

        // If no specific article content found, try meta description or main content area
        if (!content) {
          content = $("main, .main-content, .content")
            .first()
            .text()
            .trim();
        }

        // Last resort: try to get content from paragraphs in the body, excluding navigation, header, footer, etc.
        if (!content) {
          const excludeSelectors =
            "nav, header, footer, .nav, .header, .footer, .navigation, .menu, .sidebar, aside, .comments, script, style";
          content = $(
            "body"
          )
            .clone()
            .find(excludeSelectors)
            .remove()
            .end()
            .find("p")
            .map((_, el) => $(el).text().trim())
            .get()
            .filter((text) => text.length > 0)
            .join("\n\n");
        }

        // Clean up the content
        content = content
          .replace(/\s+/g, " ")
          .replace(/\n\s*\n/g, "\n\n")
          .trim();

        // If we have substantial content, get it summarized
        if (content.length > 100) {
          const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
          const host = request.headers.get('host') || '';
          const summaryResponse = await fetch(`${protocol}://${host}/api/media/summarize`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content,
              type: "article",
            }),
          });

          if (!summaryResponse.ok) {
            throw new Error("Failed to generate summary");
          }

          const { summary } = await summaryResponse.json();
          description = summary;
        }
        break;
      case "tweet":
        content = $("[data-testid='tweetText']").text().trim();
        break;
      case "youtube":
        content = $("meta[name='description']").attr("content") || "";
        break;
      default:
        content = $("body").text().trim();
    }

    return NextResponse.json({
      type,
      title: title.trim(),
      description: description || content,
      url,
      videoId,
    });
  } catch (error: any) {
    console.error("Error processing media item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process media item" },
      { status: 500 }
    );
  }
}
