/**
 * Client-side API calls for entity extraction
 * These functions call server-side API routes to keep API keys secure
 */

interface ExtractedEntity {
  keyword: string;
  type: "attraction" | "food" | "location" | "activity";
  confidence: number;
}

/**
 * Extract entities from a message using the server-side API
 */
export async function extractEntitiesFromMessageClient(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractedEntity[]> {
  try {
    console.log("[Client API] Calling extract-entities API:", {
      messageLength: message.length,
      hasContext: !!context,
      hasQuestion: !!question,
    });

    const response = await fetch("/api/extract-entities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        context,
        question,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Client API] Error response:", response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[Client API] Successfully extracted entities:", data.entities?.length || 0);

    return data.entities || [];
  } catch (error) {
    console.error("[Client API] Failed to extract entities:", error);
    throw error;
  }
}

/**
 * Cache entity extraction results
 */
const extractionCache = new Map<string, { entities: ExtractedEntity[]; timestamp: number }>();

export async function extractEntitiesWithCacheClient(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractedEntity[]> {
  const cacheKey = `${message.substring(0, 100)}-${context.substring(0, 50)}-${question.substring(0, 50)}`;
  const cached = extractionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    // Cache for 1 minute
    console.log("[Client API] Using cached entities");
    return cached.entities;
  }

  const entities = await extractEntitiesFromMessageClient(message, context, question);
  extractionCache.set(cacheKey, { entities, timestamp: Date.now() });

  return entities;
}
