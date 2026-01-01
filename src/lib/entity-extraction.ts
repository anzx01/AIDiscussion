import { apiConfig } from "./api-config";

interface ExtractedEntity {
  keyword: string;
  type: "attraction" | "food" | "location" | "activity";
  confidence: number;
}

/**
 * Extract entities (attractions, food, locations) from AI conversation
 * Uses LLM to analyze the message
 */
export async function extractEntitiesFromMessage(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractedEntity[]> {
  try {
    if (apiConfig.useMockApi) {
      // Mock extraction for development
      return mockExtractEntities(message);
    }

    // Extract location/city from the question if available
    const locationMatch = question.match(/(?:去|在|游览|visit)([^，。,.\s]{2,10})(?:旅|旅游|游玩)?/);
    const mainLocation = locationMatch ? locationMatch[1].trim() : "";

    const systemPrompt = `You are an expert at travel content analysis. Your task is to extract travel-related entities from text.

CURRENT DISCUSSION LOCATION: ${mainLocation ? mainLocation : "Unknown location"}

Extract the following types of entities:
1. Attractions (景点): museums, landmarks, scenic spots, monuments, etc.
2. Food (美食): restaurants, local dishes, street food, cuisines, etc.
3. Locations (地点): cities, neighborhoods, districts, specific areas, etc.
4. Activities (活动): shopping, sightseeing, entertainment, etc.

Return ONLY a JSON array in this exact format:
[
  {"keyword": "完整实体名称", "type": "attraction|food|location|activity", "confidence": 0.9}
]

CRITICAL RULES:
1. **ALWAYS combine the main location with generic attractions/food**
   - If main location is "汉中" (Hanzhong) and text mentions "museum", extract: "汉中博物馆" or "Hanzhong Museum"
   - If main location is "巴黎" (Paris) and text mentions "tower", extract: "埃菲尔铁塔" or "Eiffel Tower"
   - If main location is "西安" and text mentions "food", extract: "西安美食" or specific dish like "肉夹馍"

2. **NEVER extract single generic words alone**
   - ❌ Bad: "Museum", "Road", "Food", "Tower"
   - ✅ Good: "[Location] Museum", "[Location] [Specific Attraction]", "[Location] Cuisine"

3. **Prefer specific complete names over generic terms**
   - Include the main location/city name with every attraction
   - Use 2-5 word phrases for better image search results
   - If message mentions specific attraction names, use those with location prefix

4. **Language matching**
   - If the message is in Chinese, extract Chinese entity names
   - If the message is in English, extract English entity names
   - Keep location name in the same language

5. **Confidence scoring**
   - Only extract entities with confidence between 0.6 and 1.0
   - Higher confidence for specific, location-combined names
   - Lower confidence for generic terms

6. **Quantity limit**
   - Return 2-5 most relevant entities maximum
   - If no specific location-combined entities found, return empty array`;

    const userPrompt = `Analyze this message and extract travel-related entities:

Original Question: "${question}"
Current Message: "${message}"
${context ? `Conversation Context: ${context}` : ""}

Remember to ALWAYS combine the main location with attractions/food mentioned in the message.
Return only the JSON array, no other text.`;

    // Use a simple LLM call
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiConfig.zhipu.apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("Entity extraction API error:", response.status);
      return mockExtractEntities(message);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (parseError) {
      console.error("Failed to parse entity extraction response:", content);
    }

    return mockExtractEntities(message);
  } catch (error) {
    console.error("Error in extractEntitiesFromMessage:", error);
    return mockExtractEntities(message);
  }
}

/**
 * Mock entity extraction for development
 */
function mockExtractEntities(message: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Common keywords to look for
  const keywordPatterns = [
    // Attractions
    { patterns: [/塔|桥|寺|宫|博物馆|广场|公园|山|海|湖/i, /tower|bridge|temple|palace|museum|square|park|mountain|ocean|lake/i],
      type: "attraction" as const },
    // Food
    { patterns: [/美食|菜|面|饭|点|小吃|餐厅/i, /food|cuisine|dish|restaurant|noodle|dim.sum/i],
      type: "food" as const },
    // Locations
    { patterns: [/路|街|区|市|省/i, /road|street|district|city/i],
      type: "location" as const },
    // Activities
    { patterns: [/购物|观光|游览|散步/i, /shopping|sightseeing|walk|stroll/i],
      type: "activity" as const },
  ];

  // Simple keyword matching
  for (const { patterns, type } of keywordPatterns) {
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        // Use the matched word as keyword
        const match = matches[0];
        if (match.length >= 2) { // Only include if at least 2 characters
          entities.push({
            keyword: match,
            type,
            confidence: 0.7,
          });
        }
      }
    }
  }

  // Remove duplicates and limit to 5
  const unique = entities.filter((v, i, a) => a.findIndex(t => t.keyword === v.keyword) === i);
  return unique.slice(0, 5);
}

/**
 * Cache entity extraction results
 */
const extractionCache = new Map<string, { entities: ExtractedEntity[]; timestamp: number }>();

export async function extractEntitiesWithCache(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractedEntity[]> {
  const cacheKey = `${message.substring(0, 100)}-${context.substring(0, 50)}-${question.substring(0, 50)}`;
  const cached = extractionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) { // Cache for 1 minute
    return cached.entities;
  }

  const entities = await extractEntitiesFromMessage(message, context, question);
  extractionCache.set(cacheKey, { entities, timestamp: Date.now() });

  return entities;
}
