import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { url, content } = await request.json();

    if (!url || !content) {
      return NextResponse.json(
        { error: "URL and content are required" },
        { status: 400 }
      );
    }

    const systemMessage = `You are an expert at analyzing and summarizing online content. Your task is to provide a comprehensive yet concise summary of the given article or content.

Response format must be a valid JSON object with these fields:
{
  "title": "A clear, informative title that captures the main topic",
  "summary": "A detailed 2-3 paragraph summary of the content's key points, main arguments, and important details. Make it comprehensive but clear and readable.",
  "keyPoints": ["List of 3-5 key takeaways or main points from the content"],
  "topics": ["List of 2-3 main topics or themes covered"]
}

Guidelines:
- Title should be clear and descriptive
- Summary should be thorough but accessible
- Include specific details and examples when relevant
- Maintain objectivity in the summary
- Highlight the most important findings or conclusions
- Identify the main themes or topics discussed`;

    const userMessage = `Please analyze and summarize the following content:

${content}

URL Source: ${url}

Provide a comprehensive summary including the main points, key arguments, and important details.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse and validate the response
    const parsedResponse = JSON.parse(response);
    if (!parsedResponse.title || !parsedResponse.summary) {
      throw new Error("Invalid response format from OpenAI");
    }

    return NextResponse.json(parsedResponse);
  } catch (error: any) {
    console.error("Error in summarize:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize content" },
      { status: 500 }
    );
  }
}
