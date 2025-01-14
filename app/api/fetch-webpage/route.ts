import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    console.log("Fetching webpage...");
    const { url } = await req.json();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch the webpage: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract text content from relevant elements
    const title = $("title").text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "";
    const h1Text = $("h1").text().trim();
    const mainContent = ($("main").text() || $("body").text()).trim();

    return NextResponse.json({
      title,
      metaDescription,
      h1Text,
      mainContent: mainContent.substring(0, 1500),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch webpage" },
      { status: 500 }
    );
  }
}
