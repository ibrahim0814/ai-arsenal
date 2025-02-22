import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rough estimate of tokens based on characters (OpenAI uses ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Truncate text to fit within token limit, keeping some buffer for the system message and other overhead
function truncateToTokenLimit(text: string, maxTokens: number = 15000): string {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;

  // If we need to truncate, do it at a word boundary
  const truncateRatio = maxTokens / estimatedTokens;
  const targetLength = Math.floor(text.length * truncateRatio);
  const truncated = text
    .slice(0, targetLength)
    .split(" ")
    .slice(0, -1)
    .join(" ");

  return truncated + "\n\n[Content truncated due to length...]";
}

export async function POST(request: Request) {
  try {
    const { content, type } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Truncate content to fit within token limits
    const truncatedContent = truncateToTokenLimit(content);

    // Prepare the prompt based on content type
    let prompt = "";
    if (type === "article") {
      prompt = `Please provide a clear and concise summary of the following article, focusing on the main points and key takeaways. Keep the summary informative but brief (2-3 paragraphs maximum). Do not use any formatting like Markdown, asterisks, or special characters - just plain text with paragraph breaks:\n\n${truncatedContent}`;
    } else {
      prompt = `Please provide a brief summary of the following content. Use plain text only without any formatting:\n\n${truncatedContent}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates clear, accurate summaries of content. Focus on the main points and key takeaways. Always use plain text without any formatting or special characters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error summarizing content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize content" },
      { status: 500 }
    );
  }
}
