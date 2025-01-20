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

    // Remove script tags, style tags, and hidden elements
    const removedElements = $(
      'script, style, [style*="display:none"], [style*="display: none"], .hidden, [hidden]'
    ).length;
    console.log(`Removed ${removedElements} non-content elements`);
    $(
      'script, style, [style*="display:none"], [style*="display: none"], .hidden, [hidden]'
    ).remove();

    // Extract title - try different sources
    const title =
      $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("h1").first().text().trim();
    console.log("Extracted title:", title);

    // Extract description - try different sources
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim();
    console.log("Extracted meta description:", metaDescription);

    // Get all headings text
    const headings = $("h1, h2, h3")
      .map((_, el) => $(el).text().trim())
      .get()
      .join(" ");
    console.log(`Found ${$("h1, h2, h3").length} headings`);

    // Get main content using various selectors
    const mainContentSelectors = [
      "main",
      "article",
      '[role="main"]',
      "#main-content",
      ".main-content",
      ".content",
      ".article",
    ];

    let mainContent = "";
    let usedSelector = null;
    for (const selector of mainContentSelectors) {
      const content = $(selector).text().trim();
      if (content.length > mainContent.length) {
        mainContent = content;
        usedSelector = selector;
      }
    }
    console.log(
      usedSelector
        ? `Found main content using selector: ${usedSelector} (${mainContent.length} chars)`
        : "No main content found with primary selectors"
    );

    // If no main content found through selectors, get body content
    if (!mainContent) {
      console.log("Falling back to body content...");
      // Get text from body but exclude navigation, footer, and sidebar areas
      const removedSections = $(
        'nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"], .nav, .navigation, .footer, .sidebar'
      ).length;
      console.log(
        `Removed ${removedSections} navigation/footer/sidebar sections`
      );

      $(
        'nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"], .nav, .navigation, .footer, .sidebar'
      ).remove();
      mainContent = $("body").text().trim();
      console.log(
        `Extracted ${mainContent.length} characters from body content`
      );
    }

    // Clean up the content
    const cleanContent = mainContent
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, " ") // Replace multiple newlines with space
      .trim();

    // Check if we have enough meaningful content
    if (!title || !cleanContent || cleanContent.length < 100) {
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
