import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const {
      title,
      metaDescription,
      headings,
      mainContent,
      usePerplexity = false,
    } = await req.json();

    if (usePerplexity) {
      console.log("Using Perplexity API with the following data:", {
        title,
        metaDescription,
        usePerplexity,
      });

      const perplexitySystemContent = `You are an AI expert analyzing tools and platforms. Your task is to identify if a given URL or tool has AI capabilities and provide a concise description and relevant tags. Focus only on AI/ML features and capabilities.

IMPORTANT: You must respond with a raw JSON object only, no markdown formatting. The response must be parseable by JSON.parse().

Response format:
{
  "name": "ONLY the bare company/product name without ANY additional text",
  "description": "One clear sentence about the AI capabilities (string)",
  "tags": ["4-5 relevant AI-focused tags - aim for 5 whenever possible"]
}

ABSOLUTELY CRITICAL FOR NAME FIELD:
- Return ONLY the bare company/product name
- IGNORE webpage titles, meta descriptions, and taglines completely
- STRIP AWAY everything after any dash (-), colon (:), or pipe (|)
- REMOVE any suffixes like "AI", "Platform", "App" unless they're part of the official name
- Look at the domain name (without .com/.ai/etc) if unsure

Examples of correct name extraction:
✓ "Front - The Platform for Exceptional Customer Service at Scale" → "Front"
✓ "Claude.ai | Your AI Assistant" → "Claude"
✓ "Jasper - AI Writing Assistant" → "Jasper"
✓ "Midjourney: The Future of AI Art" → "Midjourney"
✓ "Anthropic: Safe & Ethical AI" → "Anthropic"
✓ "ChatGPT - OpenAI" → "ChatGPT"
✓ "OpenAI Platform | API Documentation" → "OpenAI"
✓ "Synthesia | AI Video Creation Platform" → "Synthesia"
✓ "Runway - Next-Generation AI Creative Tools" → "Runway"
✓ "Hugging Face – The AI Community Building the Future" → "Hugging Face"

WRONG examples (do not do this):
✗ "Front Platform"
✗ "Claude AI"
✗ "Jasper AI Writing"
✗ "Midjourney Art Platform"
✗ "Anthropic AI"

Guidelines for tags:
- IMPORTANT: Include 4-5 tags (prefer 5) that cover different aspects:
  1. Core technology (e.g., "natural-language-processing", "computer-vision")
  2. Primary use case (e.g., "ai-writing", "ai-image-editing")
  3. Specific capabilities (e.g., "text-generation", "image-recognition")
  4. Notable features (e.g., "gpt-4", "stable-diffusion")
  5. Domain/Industry (e.g., "ai-research", "ai-development")
- Use lowercase with hyphens for tags only
- Be specific and descriptive
- Focus on AI/ML capabilities`;

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

Return a JSON object with the tool's name, a single clear sentence about its AI capabilities, and 4-5 relevant AI-focused tags.`,
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

      const data = await response.json();
      console.log(
        "Perplexity API response data:",
        JSON.stringify(data, null, 2)
      );

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Perplexity API");
      }

      // Try to parse the content as JSON first
      try {
        const parsedResponse = JSON.parse(content);
        if (
          !parsedResponse.name ||
          !parsedResponse.description ||
          !Array.isArray(parsedResponse.tags)
        ) {
          throw new Error("Invalid JSON format");
        }
        return NextResponse.json(parsedResponse);
      } catch (parseError) {
        // If JSON parsing fails, try to parse markdown format
        console.log("Attempting to parse markdown response...");

        const nameMatch = content.match(/\*\*Tool Name:\*\*\s*(.*?)(?=\n|$)/);
        const descriptionMatch = content.match(
          /\*\*Description:\*\*\s*(.*?)(?=\n|$)/
        );
        const tagsMatch = content.match(/\*\*Tags:\*\*\s*([\s\S]*?)(?=\n\n|$)/);

        if (!nameMatch || !descriptionMatch || !tagsMatch) {
          console.error("Failed to parse markdown response:", content);
          throw new Error("Invalid response format from Perplexity API");
        }

        const tags = tagsMatch[1]
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.startsWith("-"))
          .map((line: string) => line.replace(/^-\s*"|"$/g, "").trim());

        const parsedResponse = {
          name: nameMatch[1].trim(),
          description: descriptionMatch[1].trim(),
          tags: tags,
        };

        if (
          !parsedResponse.name ||
          !parsedResponse.description ||
          !Array.isArray(parsedResponse.tags) ||
          parsedResponse.tags.length === 0
        ) {
          console.error("Invalid parsed response:", parsedResponse);
          throw new Error("Invalid response format from Perplexity API");
        }

        return NextResponse.json(parsedResponse);
      }
    }

    // Default OpenAI path
    const systemMessage = `You are an AI expert analyzing tools and platforms. Your task is to identify if a given URL or tool has AI capabilities and provide a concise description and relevant tags. Focus only on AI/ML features and capabilities.

Response format must be a valid JSON object with these fields:
{
  "name": "ONLY the bare company/product name without ANY additional text",
  "description": "One clear sentence about the AI capabilities (string)",
  "tags": ["4-5 relevant AI-focused tags - aim for 5 whenever possible"]
}

ABSOLUTELY CRITICAL FOR NAME FIELD:
- Return ONLY the bare company/product name
- IGNORE webpage titles, meta descriptions, and taglines completely
- STRIP AWAY everything after any dash (-), colon (:), or pipe (|)
- REMOVE any suffixes like "AI", "Platform", "App" unless they're part of the official name
- Look at the domain name (without .com/.ai/etc) if unsure

WRONG examples (do not do this because these are too long and not bare company names):
✓ "Front - The Platform for Exceptional Customer Service at Scale" should be "Front"
✓ "Claude.ai | Your AI Assistant" should be "Claude"
✓ "Jasper - AI Writing Assistant" should be "Jasper"
✓ "Midjourney: The Future of AI Art" should be "Midjourney"
✓ "Anthropic: Safe & Ethical AI" should be "Anthropic"
✓ "ChatGPT - OpenAI" should be "ChatGPT"
✓ "OpenAI Platform | API Documentation" should be "OpenAI"
✓ "Synthesia | AI Video Creation Platform" should be "Synthesia"
✓ "Runway - Next-Generation AI Creative Tools" should be "Runway"
✓ "Hugging Face – The AI Community Building the Future" should be "Hugging Face"

Guidelines for tags:
- IMPORTANT: Include 4-5 tags (prefer 5) that cover different aspects:
  1. Core technology (e.g., "natural-language-processing", "computer-vision")
  2. Primary use case (e.g., "ai-writing", "ai-image-editing")
  3. Specific capabilities (e.g., "text-generation", "image-recognition")
  4. Notable features (e.g., "gpt-4", "stable-diffusion")
  5. Domain/Industry (e.g., "ai-research", "ai-development")
- Use lowercase with hyphens for tags only
- Be specific and descriptive
- Focus on AI/ML capabilities`;

    const userMessage = `Analyze this tool based on the following content:

Title: ${title || "N/A"}
Meta Description: ${metaDescription || "N/A"}
Headings: ${headings || "N/A"}
Main Content: ${mainContent || "N/A"}

Identify the tool's name, provide a single clear sentence about its AI capabilities, and list 4-5 relevant AI-focused tags.`;

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
