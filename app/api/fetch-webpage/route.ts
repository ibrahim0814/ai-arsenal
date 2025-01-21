import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    console.log("Fetching webpage...");
    const { url } = await req.json();

    console.log(`Attempting to fetch URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      redirect: "follow",
    });

    // Log response details
    console.log({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
      redirected: response.redirected,
      type: response.type,
      url: response.url,
    });

    if (!response.ok) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        redirected: response.redirected,
        type: response.type,
      };
      console.error("Fetch failed with details:", errorDetails);
      return NextResponse.json(
        {
          error: `Failed to fetch webpage: [${response.status}] ${response.statusText}`,
          shouldRetryWithPerplexity: true,
          details: errorDetails,
        },
        { status: 422 }
      );
    }

    const html = await response.text();
    if (!html || html.length < 100) {
      // Basic check for valid HTML content
      return NextResponse.json(
        {
          error: "Invalid or empty webpage content",
          shouldRetryWithPerplexity: true,
        },
        { status: 422 }
      );
    }

    console.log(`Successfully fetched HTML content (${html.length} bytes)`);

    const $ = cheerio.load(html);
    console.log("Successfully loaded HTML with cheerio");

    // Extract title - try different sources
    const title =
      $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("h1").first().text().trim();
    console.log("Extracted title:", title);

    // Extract description - try different sources
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $('meta[name="twitter:description"]').attr("content")?.trim();
    console.log("Extracted meta description:", metaDescription);

    // If we have both title and meta description, that's enough to proceed
    if (title && metaDescription) {
      console.log("Found sufficient metadata to proceed");
      return NextResponse.json({
        title,
        metaDescription,
        headings: "",
        mainContent: metaDescription, // Use meta description as fallback content
      });
    }

    // Get all headings text before we modify the DOM
    const headings = $("h1, h2, h3")
      .map((_, el) => $(el).text().trim())
      .get()
      .join(" ");
    console.log(`Found ${$("h1, h2, h3").length} headings`);

    // Remove script and style tags only
    $("script, style").remove();

    // First try to get content from common article/main content areas
    const mainContentSelectors = [
      "main",
      "article",
      '[role="main"]',
      "#main-content",
      ".main-content",
      ".content",
      ".article",
      "#content",
      ".post-content",
      ".entry-content",
      ".page-content",
    ];

    let mainContent = "";
    let usedSelector = null;

    // Try each selector and keep the longest valid content
    for (const selector of mainContentSelectors) {
      const elements = $(selector);
      elements.each((_, el) => {
        const content = $(el).text().trim();
        // Only use content if it's substantial (more than just navigation/headers)
        if (content.length > 150 && content.length > mainContent.length) {
          mainContent = content;
          usedSelector = selector;
        }
      });
    }

    // If no main content found, try getting content from paragraphs and lists
    if (!mainContent || mainContent.length < 200) {
      console.log("No main content found, trying paragraphs and lists...");
      const paragraphsAndLists = $("p, ul, ol")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((text) => text.length > 20) // Filter out very short texts
        .join(" ");

      if (paragraphsAndLists.length > mainContent.length) {
        mainContent = paragraphsAndLists;
        usedSelector = "p, ul, ol";
      }
    }

    // If still no good content, fall back to body content but be smarter about it
    if (!mainContent || mainContent.length < 200) {
      console.log("Falling back to body content...");
      // Remove obvious non-content areas
      $(
        'nav, footer, [role="navigation"], [role="contentinfo"], .nav, .navigation, .footer'
      ).remove();

      // Get text from body sections that might have content
      const bodyContent = $("body")
        .find("div, section, article")
        .map((_, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          // Only include sections with substantial content
          return text.length > 100 ? text : "";
        })
        .get()
        .filter(Boolean)
        .join(" ");

      if (bodyContent.length > 0) {
        mainContent = bodyContent;
        usedSelector = "body-sections";
      }
    }

    // Clean up the content
    const cleanContent = mainContent
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, " ") // Replace multiple newlines with space
      .replace(/\t+/g, " ") // Replace tabs with space
      .trim();

    // Check if we have enough meaningful content
    if (!title || !cleanContent || cleanContent.length < 100) {
      console.log("Insufficient content found:", {
        titleLength: title?.length || 0,
        contentLength: cleanContent.length,
      });
      return NextResponse.json(
        {
          error: "Could not extract meaningful content from webpage",
          shouldRetryWithPerplexity: true,
        },
        { status: 422 }
      );
    }

    console.log(
      `Final content length after cleaning: ${cleanContent.length} characters`
    );

    const result = {
      title,
      metaDescription,
      headings,
      mainContent: cleanContent.substring(0, 2500), // Increased length for more context
    };

    console.log("Successfully processed webpage", {
      titleLength: title?.length || 0,
      descriptionLength: metaDescription?.length || 0,
      headingsLength: headings?.length || 0,
      mainContentLength: result.mainContent?.length || 0,
    });

    // At the end, before returning error:
    if (title || metaDescription) {
      console.log("Using partial metadata");
      return NextResponse.json({
        title: title || "",
        metaDescription: metaDescription || "",
        headings: "",
        mainContent: metaDescription || "", // Use what we have
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    // Enhanced error logging
    console.error("Detailed error in fetch-webpage:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });

    let errorMessage = error.message || "Failed to fetch webpage";
    if (error instanceof TypeError) {
      errorMessage = `Network or CORS error: ${errorMessage}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        shouldRetryWithPerplexity: true,
        details: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      },
      { status: 422 }
    );
  }
}
