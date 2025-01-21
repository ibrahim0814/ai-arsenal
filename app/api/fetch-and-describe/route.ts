import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    console.log("Analyzing tool/company:", url);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON-only response API. Return ONLY a JSON object with the company name, a one-sentence description of what they do, and 3-5 relevant tags that describe their main features and purpose.",
          },
          {
            role: "user",
            content: `Return a JSON like this for ${url}: {"name": "company name", "description": "one sentence about what they do", "tags": ["tag1", "tag2", "tag3"]}`,
          },
        ],
        temperature: 0.1,
        top_p: 0.9,
        frequency_penalty: 1,
        presence_penalty: 0,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error details:", errorText);
      throw new Error(
        `Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Try to extract JSON if it's wrapped in other text
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      const parsedContent = JSON.parse(content);

      // Transform to match the expected format in AddToolModal
      const transformedContent = {
        webpageInfo: {
          title: parsedContent.name,
          metaDescription: parsedContent.description,
        },
        generatedInfo: {
          description: parsedContent.description,
          tags: parsedContent.tags,
          category: "AI Tool", // Default category since we don't need it
        },
      };

      console.log("Successfully analyzed tool/company with Perplexity");
      return NextResponse.json(transformedContent);
    } catch (parseError) {
      console.error("Failed to parse Perplexity response:", content);
      throw new Error("Failed to parse structured response from Perplexity");
    }
  } catch (error: any) {
    console.error("Error in fetch-and-describe:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });

    return NextResponse.json(
      {
        error: error.message,
        details: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      },
      { status: 500 }
    );
  }
}
