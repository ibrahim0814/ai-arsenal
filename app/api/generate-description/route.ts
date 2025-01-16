import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a tool that generates concise names and descriptions for AI tools and companies. Respond with exactly two lines: first line should be just the tool/company name without any prefix, second line is a brief description focusing on the tool's main purpose and features. Be as specific as possible about what features the tool has and don't include any marketing language.",
        },
        {
          role: "user",
          content: `Based on this webpage content, grab the name of the company and write a brief description:\n\n${content}`,
        },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 100,
      temperature: 0.7,
    });

    const generatedText = completion.choices[0]?.message?.content || "";
    const [name, ...descriptionParts] = generatedText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return Response.json({
      title: name,
      description: descriptionParts.join(" ").trim(),
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
