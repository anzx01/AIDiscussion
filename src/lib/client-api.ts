/**
 * Client-side API calls for entity extraction
 * These functions call server-side API routes to keep API keys secure
 */

interface ExtractedEntity {
  keyword: string;
  type: "attraction" | "food" | "location" | "activity";
  confidence: number;
}

interface DestinationInfo {
  location: string;
  duration?: number; // Duration in days
  order: number; // Order in the trip (1st, 2nd, etc.)
}

interface ExtractionResult {
  destinations: DestinationInfo[];
  entities: ExtractedEntity[];
}

/**
 * Extract entities from a message using the server-side API
 * Now supports multiple destinations
 */
export async function extractEntitiesFromMessageClient(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractionResult> {
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
    console.log("[Client API] Successfully extracted result:", {
      destinations: data.destinations?.length || 0,
      entities: data.entities?.length || 0
    });

    return {
      destinations: data.destinations || [],
      entities: data.entities || []
    };
  } catch (error) {
    console.error("[Client API] Failed to extract entities:", error);
    throw error;
  }
}

/**
 * Cache entity extraction results
 */
const extractionCache = new Map<string, { result: ExtractionResult; timestamp: number }>();

export async function extractEntitiesWithCacheClient(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractionResult> {
  const cacheKey = `${message.substring(0, 100)}-${context.substring(0, 50)}-${question.substring(0, 50)}`;
  const cached = extractionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    // Cache for 1 minute
    console.log("[Client API] Using cached extraction result");
    return cached.result;
  }

  const result = await extractEntitiesFromMessageClient(message, context, question);
  extractionCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

// Export types for use in components
export type { ExtractedEntity, DestinationInfo, ExtractionResult };
