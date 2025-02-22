import { NextResponse } from "next/server";
import { load } from "cheerio";

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
          content = $("main, .main-content, .content").first().text().trim();
        }

        // Last resort: try to get content from paragraphs in the body, excluding navigation, header, footer, etc.
        if (!content) {
          const excludeSelectors =
            "nav, header, footer, .nav, .header, .footer, .navigation, .menu, .sidebar, aside, .comments, script, style";
          content = $("body")
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
          const protocol =
            process.env.NODE_ENV === "development" ? "http" : "https";
          const host = request.headers.get("host") || "";
          const summaryResponse = await fetch(
            `${protocol}://${host}/api/media/summarize`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content,
                type: "article",
              }),
            }
          );

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
        // For YouTube, just get the title and leave description empty
        title =
          $("meta[property='og:title']").attr("content") ||
          $("meta[name='title']").attr("content") ||
          $("title").text();
        // Clean up title by removing channel name and other suffixes
        title = title.split(/[-|]/)[0].trim();
        description = ""; // Leave description empty for YouTube videos
        break;
      default:
        content = $("body").text().trim();
    }

    return NextResponse.json({
      type,
      title: title.trim(),
      description: type === "youtube" ? "" : description || content,
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
