import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to extract JSON from markdown
function extractJsonFromMarkdown(markdownResponse: string): any {
  // Try parsing as pure JSON first
  try {
    return JSON.parse(markdownResponse);
  } catch (e) {
    // If that fails, try extracting from markdown code blocks
    const jsonMatch = markdownResponse.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
        throw new Error("Failed to parse JSON from markdown");
      }
    }
    throw new Error("No JSON found in markdown response");
  }
}

export async function POST(req: Request) {
  try {
    const {
      title,
      metaDescription,
      headings,
      mainContent,
      usePerplexity = false,
    } = await req.json();

    // Determine if we have meaningful webpage content
    const hasWebContent = Boolean(metaDescription || mainContent);

    if (usePerplexity) {
      console.log("Using Perplexity API with the following data:", {
        title,
        metaDescription,
        usePerplexity,
      });

      const perplexitySystemContent = `You are an expert at analyzing tools, platforms, and companies. Your task is to identify what a given URL or tool does and provide a concise description and relevant tags.

IMPORTANT: You must respond with a raw JSON object only, no markdown formatting. The response must be parseable by JSON.parse().

Response format:
{
  "name": "ONLY the bare company/product name without ANY additional text",
  "description": "One clear sentence about what the tool/company does (string)",
  "tags": ["4-5 relevant tags - aim for 5 whenever possible"]
}

ABSOLUTELY CRITICAL FOR NAME FIELD:
- Return ONLY the bare company/product name
- IGNORE webpage titles, meta descriptions, and taglines completely
- STRIP AWAY everything after any dash (-), colon (:), or pipe (|)
- REMOVE any suffixes like "Platform", "App" unless they're part of the official name
- Look at the domain name (without .com/.ai/etc) if unsure

Examples of correct name extraction:
✓ "Slack - Business Communication Platform" → "Slack"
✓ "Dropbox - Cloud Storage & Collaboration" → "Dropbox"
✓ "Zoom: Video Conferencing Solution" → "Zoom"
✓ "Notion | All-in-one Workspace" → "Notion"
✓ "Figma - The Collaborative Design Platform" → "Figma"

Guidelines for tags:
- IMPORTANT: Include 4-5 tags (prefer 5) that cover different aspects:
  1. Core functionality (e.g., "file-sharing", "communication")
  2. Primary use case (e.g., "team-collaboration", "project-management")
  3. Specific features (e.g., "cloud-storage", "video-calls")
  4. Notable capabilities (e.g., "real-time", "cross-platform")
  5. Domain/Industry (e.g., "productivity", "design")
- Use lowercase with hyphens for tags only
- Be specific and descriptive
- Focus on the tool's main purpose and features`;

      const requestBody = {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: perplexitySystemContent,
          },
          {
            role: "user",
            content: `Analyze this tool based on the following URL and content:

URL: ${title || "N/A"}
Description: ${metaDescription || "N/A"}

Return a JSON object with the tool's name, a single clear sentence about its capabilities, and 4-5 relevant tags.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "year",
      };

      console.log(
        "Perplexity API request body:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Perplexity API response status:", response.status);
      console.log(
        "Perplexity API response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });
        throw new Error(
          `Perplexity API error: ${response.status} ${response.statusText}\nResponse: ${errorText}`
        );
      }

      const responseData = await response.json();
      console.log("Perplexity API response data:", responseData);

      const content = responseData.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Perplexity API response");
      }

      // Parse the response using our new helper function
      const parsedResponse = extractJsonFromMarkdown(content);

      // Validate the parsed response has the required fields
      if (
        !parsedResponse.name ||
        !parsedResponse.description ||
        !Array.isArray(parsedResponse.tags)
      ) {
        throw new Error("Invalid response structure from Perplexity API");
      }

      return NextResponse.json(parsedResponse);
    }

    // Default OpenAI path
    const systemMessage = `You are an expert at analyzing tools, platforms, and companies. Your task is to identify what a given URL or tool does and provide a concise description and relevant tags.

Response format must be a valid JSON object with these fields:
{
  "name": "ONLY the bare company/product name without ANY additional text",
  "description": "One clear sentence about what the tool/company does (string)",
  "tags": ["4-5 relevant tags - aim for 5 whenever possible"]
}

ABSOLUTELY CRITICAL FOR NAME FIELD:
- Return ONLY the bare company/product name
- IGNORE webpage titles, meta descriptions, and taglines completely
- STRIP AWAY everything after any dash (-), colon (:), or pipe (|)
- REMOVE any suffixes like "Platform", "App" unless they're part of the official name
- Look at the domain name (without .com/.ai/etc) if unsure

Examples of correct name extraction:
✓ "Slack - Business Communication Platform" → "Slack"
✓ "Dropbox - Cloud Storage & Collaboration" → "Dropbox"
✓ "Zoom: Video Conferencing Solution" → "Zoom"
✓ "Notion | All-in-one Workspace" → "Notion"
✓ "Figma - The Collaborative Design Platform" → "Figma"

Guidelines for tags:
- IMPORTANT: Include 4-5 tags (prefer 5) that cover different aspects:
  1. Core functionality (e.g., "file-sharing", "communication")
  2. Primary use case (e.g., "team-collaboration", "project-management")
  3. Specific features (e.g., "cloud-storage", "video-calls")
  4. Notable capabilities (e.g., "real-time", "cross-platform")
  5. Domain/Industry (e.g., "productivity", "design")
- Use lowercase with hyphens for tags only
- Be specific and descriptive
- Focus on the tool's main purpose and features`;

    const userMessage = hasWebContent
      ? `Analyze this tool based on the following content:

Title: ${title || "N/A"}
Meta Description: ${metaDescription || "N/A"}
Headings: ${headings || "N/A"}
Main Content: ${mainContent || "N/A"}

Identify the tool's name, provide a single clear sentence about its capabilities, and list 4-5 relevant tags.`
      : `Based on your knowledge, analyze the tool at URL: ${title}

Provide the company/product name, a single clear sentence about what it does, and 4-5 relevant tags that describe its core functionality and features.

Note: Focus on the core product/service without any AI-specific assumptions unless it's clearly an AI company.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    console.log("OpenAI Response:", response);

    // Parse and validate the response
    const parsedResponse = JSON.parse(response);
    if (
      !parsedResponse.name ||
      !parsedResponse.description ||
      !Array.isArray(parsedResponse.tags)
    ) {
      throw new Error("Invalid response format from OpenAI");
    }

    return NextResponse.json(parsedResponse);
  } catch (error: any) {
    console.error("Error in generate-description:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
