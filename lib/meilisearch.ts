import { MeiliSearch } from "meilisearch";

const client = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY,
});

const TOOLS_INDEX = "tools";

export async function indexTools(tools: any[]) {
  try {
    const index = client.index(TOOLS_INDEX);

    // Set searchable attributes
    await index.updateSearchableAttributes([
      "name",
      "description",
      "category",
      "tags",
    ]);

    // Set filterable attributes
    await index.updateFilterableAttributes(["category", "tags"]);

    // Add or update documents
    await index.addDocuments(tools);
  } catch (error) {
    console.error("Error indexing tools:", error);
    throw error;
  }
}

export async function searchTools(query: string, filters?: string) {
  try {
    const index = client.index(TOOLS_INDEX);
    const searchParams: any = {
      limit: 50,
    };

    if (filters) {
      searchParams.filter = filters;
    }

    return await index.search(query, searchParams);
  } catch (error) {
    console.error("Error searching tools:", error);
    throw error;
  }
}

export async function deleteToolFromIndex(toolId: string) {
  try {
    const index = client.index(TOOLS_INDEX);
    await index.deleteDocument(toolId);
  } catch (error) {
    console.error("Error deleting tool from index:", error);
    throw error;
  }
}

export async function updateToolInIndex(tool: any) {
  try {
    const index = client.index(TOOLS_INDEX);
    await index.updateDocuments([tool]);
  } catch (error) {
    console.error("Error updating tool in index:", error);
    throw error;
  }
}

export default client;
