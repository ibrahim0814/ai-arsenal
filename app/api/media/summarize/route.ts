import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { content, type } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Prepare the prompt based on content type
    let prompt = "";
    if (type === "article") {
      prompt = `Please provide a clear and concise summary of the following article, focusing on the main points and key takeaways. Keep the summary informative but brief (2-3 paragraphs maximum):\n\n${content}`;
    } else {
      prompt = `Please provide a brief summary of the following content:\n\n${content}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates clear, accurate summaries of content. Focus on the main points and key takeaways."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
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
