import OpenAI from "openai";
import { TAG_OPTIONS } from "@/lib/constants";

interface TagOption {
  value: string;
  label: string;
  color: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    const existingTags = TAG_OPTIONS.map((tag) => ({
      value: tag.value,
      label: tag.label,
    }));

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a tool that generates structured information about AI tools and companies. You should analyze the content and return a JSON object with the following structure:
            {
              "name": "Tool/Company Name",
              "description": "A brief, specific description focusing on main features without marketing language",
              "tags": {
                "existing": ["tag1", "tag2"], // Use these from our existing tags if relevant: ${JSON.stringify(
                  existingTags
                )}
                "new": ["new-tag1", "new-tag2"] // Suggest new tags if the existing ones don't fully capture the tool's capabilities
              }
            }
            Guidelines for tags:
            1. First try to use existing tags when they fit
            2. Only suggest new tags when existing ones don't adequately describe the tool
            3. New tags should be lowercase, hyphen-separated, and descriptive
            4. Limit total tags (existing + new) to 5 max
            5. Make tags specific to AI/ML capabilities and use cases`,
        },
        {
          role: "user",
          content: `Based on this webpage content, analyze and return structured information about the tool/company:\n\n${content}`,
        },
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = JSON.parse(
      completion.choices[0]?.message?.content || "{}"
    );

    // Get existing tags
    const existingTagsWithColors = (response.tags?.existing || [])
      .filter((tag: string) =>
        TAG_OPTIONS.some((option) => option.value === tag)
      )
      .map((tag: string) => ({
        value: tag,
      }));

    // Format new tags
    const newTagsWithColors = (response.tags?.new || []).map((tag: string) => ({
      value: tag,
    }));

    // Combine all tags into a single array
    const allTags = [...existingTagsWithColors, ...newTagsWithColors];

    return Response.json({
      title: response.name,
      description: response.description,
      tags: allTags,
    });
  } catch (error: any) {
    console.error("Error generating description:", error);
    return Response.json(
      { error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
