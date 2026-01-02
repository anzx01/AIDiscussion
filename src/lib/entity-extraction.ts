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
    // Extract location/city from the question if available (needed for both LLM and mock)
    // Support more patterns: "北京一日游", "去巴黎旅游", "西安行程", "plan a trip to London", "For a 1-day青岛游", etc.
    const locationPatterns = [
      // Pattern: "XX一日游", "XX二日游", "XX三日游" (must be at the beginning or after spaces/digits)
      /(?:^|\s|\d+)([\u4e00-\u9fa5]{2,4})(?:一日游|二日游|三日游)/,
      // Pattern: "去XX旅游", "在XX游览", "来到XX"
      /(?:去|在|游览|参观|来到)([\u4e00-\u9fa5]{2,10})(?:旅|旅游|游玩|行程|trip|tour)?/,
      // Pattern: "XX旅游", "XX游" at start
      /^([\u4e00-\u9fa5]{2,10})(?:旅|旅游|游)/,
      // Pattern: "我想XX", "帮我规划XX", "推荐XX"
      /(?:我想|我想去|帮我规划|推荐)([\u4e00-\u9fa5]{2,10})(?:旅|旅游|游玩|的)?/,
      // Mixed Chinese-English patterns (e.g., "For a 1-day青岛游")
      /(?:\d+\s*(?:day|天)\s+)([\u4e00-\u9fa5]{2,10})(?:游|tour|旅|旅游)/i,
      // Extract Chinese characters from the question (fallback - most greedy, last resort)
      /([\u4e00-\u9fa5]{2,4})/,
    ];

    let mainLocation = "";
    for (const pattern of locationPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        mainLocation = match[1].trim();
        console.log("[Entity Extraction] Extracted mainLocation using pattern:", pattern.source, "=>", mainLocation);
        break;
      }
    }

    console.log("[Entity Extraction] Final mainLocation:", mainLocation);

    if (apiConfig.useMockApi) {
      // Mock extraction for development
      console.log("[Entity Extraction] Using MOCK mode, mainLocation:", mainLocation);
      return mockExtractEntities(message, mainLocation);
    }

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
1. **ALWAYS combine location with attractions/food**
   - If main location is known from the question, ALWAYS use it as a prefix
   - Example: Location="北京" + Message mentions "长城" → Extract: "北京长城景点"
   - Example: Location="巴黎" + Message mentions "铁塔" → Extract: "巴黎埃菲尔铁塔"
   - Example: Location="西安" + Message mentions "美食" → Extract: "西安美食"

2. **NEVER extract single generic words alone**
   - ❌ Bad: "长城", "Museum", "Food", "Tower"
   - ✅ Good: "北京长城景点", "北京故宫博物院", "西安美食", "巴黎埃菲尔铁塔"

3. **Identify the main location from context if not provided**
   - Look for city names, place names, or destinations mentioned in the question or message
   - If message mentions specific attraction names (e.g., "东方明珠"), extract the full name: "上海东方明珠"
   - Use pattern matching: [地点] + [景点类型] or [具体景点全名]

4. **Smart entity extraction**
   - For attractions: Use format "[地点][景点名称]景点" or full attraction name
     - Examples: "北京故宫博物院", "上海外滩", "西安兵马俑"
   - For food: Use format "[地点][美食类型]美食"
     - Examples: "四川火锅美食", "北京烤鸭美食", "广东点心小吃"
   - For locations: Use the specific location name with "风光" or "旅游" suffix
     - Examples: "杭州西湖风光", "云南丽江旅游"

5. **Language consistency**
   - If the message is in Chinese, extract Chinese entity names
   - If the message is in English, extract English entity names
   - Keep location and entity names in the same language

6. **Confidence scoring**
   - Only extract entities with confidence between 0.6 and 1.0
   - Higher confidence (0.8-1.0) for complete, specific location-entity combinations
   - Lower confidence (0.6-0.7) for generic terms without clear location

7. **Quantity limit**
   - Return 2-5 most relevant entities maximum
   - Prioritize quality over quantity
   - If no clear location-entity combinations found, return empty array`;

    const userPrompt = `Analyze this message and extract travel-related entities:

**Original Question:** "${question}"
**Current Message:** "${message}"
${context ? `**Conversation Context:** ${context}` : ""}

${mainLocation ? `**IMPORTANT:** The main location is "${mainLocation}". All entities MUST be prefixed with this location unless the entity already includes a specific location.` : ""}

**Extraction Requirements:**
1. If main location is known, combine it with entities mentioned in the message
2. Extract complete attraction/food names with their locations
3. Use appropriate suffixes: "景点" for attractions, "美食" for food, "风光"/"旅游" for locations
4. Return only high-quality, specific entities that would work well for image search

Return only the JSON array, no other text.`;

    // Use DeepSeek API for entity extraction (simpler authentication)
    console.log("[Entity Extraction] Calling DeepSeek API with mainLocation:", mainLocation);
    console.log("[Entity Extraction] API Key exists:", !!apiConfig.deepseek.apiKey);
    console.log("[Entity Extraction] API Key prefix:", apiConfig.deepseek.apiKey?.substring(0, 15));

    const response = await fetch(`${apiConfig.deepseek.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiConfig.deepseek.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("[Entity Extraction] API error:", response.status);
      const errorText = await response.text();
      console.error("[Entity Extraction] Error details:", errorText);
      return mockExtractEntities(message, mainLocation);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("[Entity Extraction] LLM response:", content);

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        console.log("[Entity Extraction] Successfully extracted entities:", parsed);
        return parsed;
      }
    } catch (parseError) {
      console.error("[Entity Extraction] Failed to parse LLM response:", content);
    }

    console.warn("[Entity Extraction] Falling back to mock extraction");
    return mockExtractEntities(message, mainLocation);
  } catch (error) {
    console.error("Error in extractEntitiesFromMessage:", error);
    return mockExtractEntities(message, mainLocation);
  }
}

/**
 * Mock entity extraction for development
 * Simple rule-based extraction without hardcoded cities
 */
function mockExtractEntities(message: string, mainLocation: string): ExtractedEntity[] {
  console.log("[Mock Entity Extraction] Called with:", { message: message.substring(0, 50), mainLocation });
  const entities: ExtractedEntity[] = [];

  // Use mainLocation from question if available
  let location = mainLocation;

  // If no mainLocation, try to extract from message
  if (!location) {
    // Try to extract Chinese location from message (2-4 characters)
    const chineseLocationMatch = message.match(/([\u4e00-\u9fa5]{2,4})/);
    if (chineseLocationMatch) {
      location = chineseLocationMatch[1];
      console.log("[Mock Entity Extraction] Extracted location from message:", location);
    }
  }

  console.log("[Mock Entity Extraction] Using location:", location);

  // If we have a location, always extract it as an entity
  if (location) {
    entities.push({
      keyword: `${location}景点`,
      type: "attraction",
      confidence: 0.9,
    });
    console.log("[Mock Entity Extraction] Added location entity:", `${location}景点`);
  }

  // Common attraction/food keywords (generic, not location-specific)
  const keywordPatterns = [
    // Attractions - look for common attraction-related words
    {
      patterns: [
        /长城|故宫|兵马俑|天坛|颐和园|外滩|东方明珠|西湖|泰山|黄山|九寨沟|张家界/,
        /[\u4e00-\u9fa5]{2,4}(?:塔|寺|庙|宫|殿|楼|阁|亭|台)/, // XXX塔, XXX寺
        /[\u4e00-\u9fa5]{2,4}(?:公园|广场|博物馆|美术馆|展览馆|纪念馆)/,
        /[\u4e00-\u9fa5]{2,4}(?:山|河|湖|海|江|岛|湾|港|桥)/,
        /[\u4e00-\u9fa5]{2,4}(?:街|路|巷|胡同|里|弄)/,
      ],
      type: "attraction" as const,
      suffixes: ["景点", "旅游"]
    },
    // Food
    {
      patterns: [
        /[\u4e00-\u9fa5]{2,4}(?:菜|美食|小吃|料理|餐厅|饭店|火锅|烧烤|烤肉)/,
        /(?:北京烤鸭|上海小笼包|四川火锅|西安肉夹馍|兰州拉面|广东点心|长沙臭豆腐)/,
      ],
      type: "food" as const,
      suffixes: ["美食", "小吃"]
    },
    // Activities
    {
      patterns: [
        /(?:购物|观光|游览|参观|漫步|散步|游玩|娱乐|休闲)/,
      ],
      type: "activity" as const,
      suffixes: ["景点"]
    },
  ];

  // Simple keyword matching with location prefix
  for (const { patterns, type, suffixes } of keywordPatterns) {
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        const keyword = matches[0];

        // Skip if this is the same as the location (avoid duplicates)
        if (keyword === location) continue;

        // Combine with location if available
        const fullKeyword = location ? `${location}${keyword}` : keyword;

        // Add suffix for better image search (check if already has suffix)
        const hasSuffix = /景点|旅游|美食|小吃|风光$/.test(fullKeyword);
        const finalKeyword = hasSuffix ? fullKeyword : `${fullKeyword}${suffixes[0]}`;

        entities.push({
          keyword: finalKeyword,
          type,
          confidence: location ? 0.8 : 0.6,
        });

        console.log("[Mock Entity Extraction] Matched:", { keyword, fullKeyword, finalKeyword });
      }
    }
  }

  // Remove duplicates and limit to 5
  const unique = entities.filter((v, i, a) => a.findIndex(t => t.keyword === v.keyword) === i);
  const result = unique.slice(0, 5);
  console.log("[Mock Entity Extraction] Extracted entities:", result);
  return result;
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
