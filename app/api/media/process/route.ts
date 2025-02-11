import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import * as cheerio from "cheerio";

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

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // First check if it's a tweet
    if (isTweetUrl(url)) {
      return NextResponse.json({
        type: "tweet",
        title: "Tweet", // We'll show the actual tweet content in the UI
        description: url,
        embedHtml: `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js"></script>`,
      });
    }

    // Then check if it's a YouTube video
    if (isYouTubeUrl(url)) {
      const videoId = getYouTubeVideoId(url);
      if (!videoId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL" },
          { status: 400 }
        );
      }

      // Fetch video title using our fetch-webpage function
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch webpage: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title =
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="twitter:title"]').attr("content") ||
        $("title").text() ||
        "YouTube Video";

      return NextResponse.json({
        type: "youtube",
        title: title.trim(),
        description: url,
        videoId,
      });
    }

    // For all other URLs, treat as articles
    // First fetch webpage content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get basic metadata
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      $("h1").first().text() ||
      "Untitled";

    // Get main content for summarization
    const mainContent = $(
      "article, main, .content, .post-content, .article-content"
    )
      .first()
      .text()
      .trim();

    // Use our summarize endpoint to get a proper description
    const summaryResponse = await fetch(
      new URL("/api/media/summarize", request.url).toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          content: mainContent || $("body").text().trim(),
        }),
      }
    );

    if (!summaryResponse.ok) {
      throw new Error("Failed to generate summary");
    }

    const summaryData = await summaryResponse.json();

    return NextResponse.json({
      type: "article",
      title: title.trim(),
      description: summaryData.summary,
      url,
    });
  } catch (error: any) {
    console.error("Error processing media item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process media item" },
      { status: 500 }
    );
  }
}
