import { apiConfig } from "./api-config";

interface ExtractedEntity {
  keyword: string;
  type: "attraction" | "food" | "location" | "activity";
  confidence: number;
}

interface DestinationInfo {
  location: string;
  duration?: number; // Duration in days
  order: number; // Order in the trip (1st, 2nd, etc.)
  isReturnTrip?: boolean; // Whether this is the return trip (e.g., "回北京")
}

interface ExtractionResult {
  destinations: DestinationInfo[];
  entities: ExtractedEntity[];
}

/**
 * Use AI to intelligently filter destinations vs return trips
 * This is more flexible than rule-based matching
 */
async function filterDestinationsWithAI(
  question: string,
  allDestinations: DestinationInfo[]
): Promise<DestinationInfo[]> {
  if (allDestinations.length === 0) {
    return [];
  }

  // If there's only 1 destination, it's definitely a travel destination
  if (allDestinations.length === 1) {
    return allDestinations;
  }

  // If using mock API, use simple heuristic (last destination is return trip)
  if (apiConfig.useMockApi) {
    console.log("[AI Filter] Using mock mode - marking last destination as return trip");
    return allDestinations.map((d, i) => ({
      ...d,
      isReturnTrip: i === allDestinations.length - 1
    }));
  }

  try {
    const destinationsList = allDestinations.map(d =>
      `${d.location}${d.duration ? `(${d.duration}天)` : ''}`
    ).join("、");

    const prompt = `你是一个旅行规划助手。请分析用户的旅行问题，判断哪些地点是真正的旅游目的地，哪些是返回起点。

用户的问题：${question}

提取的所有地点：${destinationsList}

请分析并返回JSON格式：
{
  "travelDestinations": ["地点1", "地点2", ...],  // 真正的旅游目的地
  "returnTrip": "地点X"  // 返回起点（如果有的话），如果没有返回null
}

判断标准：
1. **旅游目的地**：用户明确表示要去游览、参观、游玩的地方
2. **返回起点**：旅行结束后的返回地点，通常用"回"、"返回"、"最后到"等词语
3. 如果用户说"最后回北京"、"结束于上海"等，这些是返回起点，不是旅游目的地

只返回JSON，不要其他内容。`;

    console.log("[AI Filter] Calling LLM to intelligently filter destinations");
    const response = await fetch(`${apiConfig.deepseek.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiConfig.deepseek.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.1, // Low temperature for consistent classification
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.warn("[AI Filter] API call failed, using rule-based fallback");
      // Fallback: last destination is return trip
      return allDestinations.map((d, i) => ({
        ...d,
        isReturnTrip: i === allDestinations.length - 1
      }));
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log("[AI Filter] LLM response:", content);

    // Parse JSON response
    const result = JSON.parse(content);
    const travelDestinations = result.travelDestinations || [];
    const returnTrip = result.returnTrip;

    // Mark destinations
    return allDestinations.map(d => ({
      ...d,
      isReturnTrip: d.location === returnTrip || !travelDestinations.includes(d.location)
    }));
  } catch (error) {
    console.error("[AI Filter] Error using AI, falling back to rule-based:", error);
    // Fallback: use simple rule-based marking
    return allDestinations.map((d, i) => ({
      ...d,
      isReturnTrip: i === allDestinations.length - 1
    }));
  }
}

/**
 * Extract multiple destinations from a travel question
 * Supports patterns like "去成都呆2天，然后再去重庆呆3天"
 */
export async function extractDestinations(question: string): Promise<DestinationInfo[]> {
  const destinations: DestinationInfo[] = [];

  // Pattern to find all destinations with their durations
  // Matches: "去成都呆2天", "去重庆3天", "在 Paris 5 days", "回北京", etc.
  const patterns = [
    // Chinese pattern: 去/在/游/回/到/从 [地点] [数字]天/日 (added "回", "到", "从")
    /(?:去|在|游|参观|游览|回|到|从)([\u4e00-\u9fa5]{2,15})(?:呆|玩|住|停留|停留|游览)?(?:\s*)(\d+)\s*(?:天|日)/g,
    // Chinese pattern: [数字]天/日 [地点]
    /(\d+)\s*(?:天|日)\s*(?:去|在|回|到)?([\u4e00-\u9fa5]{2,15})/g,
    // Simple pattern: "我想去XX" or "推荐XX" without duration
    /(?:我想|想去|推荐|规划)([\u4e00-\u9fa5]{2,15})(?:旅|旅游|游玩|的)?/g,
    // Pattern: XX旅游, XX游 at start
    /([\u4e00-\u9fa5]{2,15})(?:一日游|二日游|三日游|旅|旅游|游)/g,
    // Pattern: "XX一日游" etc.
    /(?:^|\s)([\u4e00-\u9fa5]{2,15})(?:一日游|二日游|三日游)/g,
    // Pattern: 去/在/游/回/到/从 [地点] without duration (added "回", "到", "从", "然后")
    /(?:然后|接着|之后)?(?:去|在|游|回|到|从)([\u4e00-\u9fa5]{2,15})(?:的|，|。|$)/g,
  ];

  // Try to extract destinations with durations
  for (const pattern of patterns) {
    const matches = question.matchAll(pattern);
    for (const match of matches) {
      let location = "";
      let duration: number | undefined;

      // Check which pattern matched and extract accordingly
      if (match[1] && match[2]) {
        // Pattern has both location and duration
        if (isNaN(parseInt(match[1]))) {
          // First group is location, second is duration
          location = match[1].trim();
          duration = parseInt(match[2]);
        } else {
          // First group is duration, second is location
          duration = parseInt(match[1]);
          location = match[2].trim();
        }
      } else if (match[1]) {
        // Only have location
        location = match[1].trim();
        // Try to find duration separately
        const durationMatch = question.match(new RegExp(`${location}(?:呆|玩|住|停留)?(?:\\s*)(\\d+)\\s*(?:天|日)`));
        if (durationMatch) {
          duration = parseInt(durationMatch[1]);
        }
      }

      if (location) {
        // Avoid duplicates
        const exists = destinations.some(d => d.location === location);
        if (!exists) {
          destinations.push({
            location,
            duration,
            order: destinations.length + 1
          });
        }
      }
    }
  }

  // If no destinations found, try simple location extraction
  if (destinations.length === 0) {
    const simpleLocationPatterns = [
      /(?:去|在|游览|参观|来到|回|到|从)([\u4e00-\u9fa5]{2,15})(?:旅|旅游|游玩|行程|trip|tour)?/,
      /^([\u4e00-\u9fa5]{2,15})(?:旅|旅游|游)/,
      /([\u4e00-\u9fa5]{2,10})/,
    ];

    for (const pattern of simpleLocationPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Avoid common non-location words
        const skipWords = ["我想", "帮我", "推荐", "规划", "怎么", "如何", "什么", "哪里", "哪些"];
        if (!skipWords.includes(location)) {
          destinations.push({
            location,
            duration: undefined,
            order: 1
          });
          break;
        }
      }
    }
  }

  console.log("[extractDestinations] Found destinations:", destinations);

  // Use AI to intelligently filter travel destinations vs return trips
  return await filterDestinationsWithAI(question, destinations);
}

/**
 * Extract entities (attractions, food, locations) from AI conversation
 * Uses LLM to analyze the message
 * Now supports multiple destinations
 */
export async function extractEntitiesFromMessage(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractionResult> {
  let destinations: DestinationInfo[] = [];

  try {
    // Extract multiple destinations from the question (now async with AI filtering)
    const allDestinations = await extractDestinations(question);
    console.log("[Entity Extraction] All extracted destinations (after AI filtering):", allDestinations);

    // Filter out return trip destinations (e.g., "回北京") - only keep actual travel destinations
    destinations = allDestinations.filter(d => !d.isReturnTrip);
    console.log("[Entity Extraction] Filtered destinations (excluding return trips):", destinations);

    // For backward compatibility, use the first destination as mainLocation
    const mainLocation = destinations.length > 0 ? destinations[0].location : "";
    console.log("[Entity Extraction] Final mainLocation (first destination):", mainLocation);

    if (apiConfig.useMockApi) {
      // Mock extraction for development
      console.log("[Entity Extraction] Using MOCK mode, destinations:", destinations);
      return mockExtractEntities(message, destinations);
    }

    const systemPrompt = `You are an expert at travel content analysis. Your task is to extract travel-related entities from text.

**CURRENT DESTINATIONS:** ${destinations.map(d => d.location).join(", ") || "Unknown"}
**MAIN LOCATION:** ${mainLocation || "Unknown"}

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
   - If a destination is known, ALWAYS use it as a prefix
   - Example: Location="北京" + Message mentions "长城" → Extract: "北京长城景点"
   - Example: Location="巴黎" + Message mentions "铁塔" → Extract: "巴黎埃菲尔铁塔"
   - Example: Location="西安" + Message mentions "美食" → Extract: "西安美食"

2. **Multiple destinations support**
   - When the user mentions multiple destinations, extract entities for ALL mentioned destinations
   - If the message mentions entities for different destinations, create separate entries for each
   - Example: If destinations are ["成都", "重庆"] and message mentions "美食", extract: "成都美食", "重庆美食"
   - Example: If destinations are ["重庆", "成都", "西安", "北京"], ALWAYS extract entities for ALL destinations: "重庆景点", "成都美食", "西安景点", "北京美食", etc.
   - CRITICAL: Even if the AI message only mentions one location, you MUST extract entities for ALL known destinations

3. **NEVER extract single generic words alone**
   - ❌ Bad: "长城", "Museum", "Food", "Tower"
   - ✅ Good: "北京长城景点", "北京故宫博物院", "西安美食", "巴黎埃菲尔铁塔"

4. **Identify the main location from context if not provided**
   - Look for city names, place names, or destinations mentioned in the question or message
   - If message mentions specific attraction names (e.g., "东方明珠"), extract the full name: "上海东方明珠"
   - Use pattern matching: [地点] + [景点类型] or [具体景点全名]

5. **Smart entity extraction**
   - For attractions: Use format "[地点][景点名称]景点" or full attraction name
     - Examples: "北京故宫博物院", "上海外滩", "西安兵马俑"
   - For food: Use format "[地点][美食类型]美食"
     - Examples: "四川火锅美食", "北京烤鸭美食", "广东点心小吃"
   - For locations: Use the specific location name with "风光" or "旅游" suffix
     - Examples: "杭州西湖风光", "云南丽江旅游"

6. **Language consistency**
   - If the message is in Chinese, extract Chinese entity names
   - If the message is in English, extract English entity names
   - Keep location and entity names in the same language

7. **Confidence scoring**
   - Only extract entities with confidence between 0.6 and 1.0
   - Higher confidence (0.8-1.0) for complete, specific location-entity combinations
   - Lower confidence (0.6-0.7) for generic terms without clear location

8. **Quantity limit**
   - Return 2-8 most relevant entities maximum (increased for multiple destinations)
   - Prioritize quality over quantity
   - If no clear location-entity combinations found, return empty array`;

    const userPrompt = `Analyze this message and extract travel-related entities:

**Original Question:** "${question}"
**Current Message:** "${message}"
${context ? `**Conversation Context:** ${context}` : ""}

**Known Destinations:** ${destinations.map(d => `${d.location}${d.duration ? `(${d.duration}天)` : ""}`).join(", ")}

**Extraction Requirements:**
1. **CRITICAL: Extract entities for ALL mentioned destinations** - Do not skip any destination
2. For each destination, extract at least 1-2 entities (attractions and/or food)
3. If the user mentions a specific destination in their message, prioritize that destination but still include others
4. Extract complete attraction/food names with their locations
5. Use appropriate suffixes: "景点" for attractions, "美食" for food, "风光"/"旅游" for locations
6. Return only high-quality, specific entities that would work well for image search

**Important:** Even if the current AI message only discusses one location, you MUST extract entities for ALL destinations in the trip to provide comprehensive visual context.

Return only the JSON array, no other text.`;

    // Use DeepSeek API for entity extraction (simpler authentication)
    console.log("[Entity Extraction] Calling DeepSeek API with mainLocation:", mainLocation);
    console.log("[Entity Extraction] API Key exists:", !!apiConfig.deepseek.apiKey);

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
      return mockExtractEntities(message, destinations);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("[Entity Extraction] LLM response:", content);

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        console.log("[Entity Extraction] Successfully extracted entities:", parsed);
        return {
          destinations,
          entities: parsed
        };
      }
    } catch (parseError) {
      console.error("[Entity Extraction] Failed to parse LLM response:", content);
    }

    console.warn("[Entity Extraction] Falling back to mock extraction");
    return mockExtractEntities(message, destinations);
  } catch (error) {
    console.error("Error in extractEntitiesFromMessage:", error);
    return mockExtractEntities(message, destinations);
  }
}

/**
 * Mock entity extraction for development
 * Simple rule-based extraction without hardcoded cities
 * Now supports multiple destinations
 */
function mockExtractEntities(message: string, destinations: DestinationInfo[]): ExtractionResult {
  console.log("[Mock Entity Extraction] Called with:", {
    message: message.substring(0, 50),
    destinations: destinations.map(d => d.location)
  });
  const entities: ExtractedEntity[] = [];

  // If we have destinations, extract entities for each one
  if (destinations.length > 0) {
    for (const dest of destinations) {
      const location = dest.location;

      // Always add the location itself as an attraction entity
      entities.push({
        keyword: `${location}景点`,
        type: "attraction",
        confidence: 0.9,
      });
      console.log("[Mock Entity Extraction] Added location entity:", `${location}景点`);

      // Add food entity for each destination
      entities.push({
        keyword: `${location}美食`,
        type: "food",
        confidence: 0.85,
      });
      console.log("[Mock Entity Extraction] Added food entity:", `${location}美食`);
    }
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

  // Simple keyword matching - combine with all destinations
  for (const { patterns, type, suffixes } of keywordPatterns) {
    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        const keyword = matches[0];

        // For multiple destinations, create entities for each destination
        if (destinations.length > 0) {
          // Only create entities if keyword is not already a destination name
          const isDestinationName = destinations.some(d => d.location === keyword);
          if (!isDestinationName) {
            // Create entity for first destination only to avoid duplication
            const location = destinations[0].location;
            const fullKeyword = `${location}${keyword}`;

            // Add suffix for better image search
            const hasSuffix = /景点|旅游|美食|小吃|风光$/.test(fullKeyword);
            const finalKeyword = hasSuffix ? fullKeyword : `${fullKeyword}${suffixes[0]}`;

            entities.push({
              keyword: finalKeyword,
              type,
              confidence: 0.8,
            });

            console.log("[Mock Entity Extraction] Matched:", { keyword, fullKeyword, finalKeyword });
          }
        } else {
          // No destination, use keyword as-is
          const hasSuffix = /景点|旅游|美食|小吃|风光$/.test(keyword);
          const finalKeyword = hasSuffix ? keyword : `${keyword}${suffixes[0]}`;

          entities.push({
            keyword: finalKeyword,
            type,
            confidence: 0.6,
          });

          console.log("[Mock Entity Extraction] Matched (no location):", { keyword, finalKeyword });
        }
      }
    }
  }

  // Remove duplicates and limit to 8 (increased for multiple destinations)
  const unique = entities.filter((v, i, a) => a.findIndex(t => t.keyword === v.keyword) === i);
  const result = unique.slice(0, 8);
  console.log("[Mock Entity Extraction] Extracted entities:", result);
  return {
    destinations,
    entities: result
  };
}

/**
 * Cache entity extraction results
 */
const extractionCache = new Map<string, { result: ExtractionResult; timestamp: number }>();

export async function extractEntitiesWithCache(
  message: string,
  context: string = "",
  question: string = ""
): Promise<ExtractionResult> {
  const cacheKey = `${message.substring(0, 100)}-${context.substring(0, 50)}-${question.substring(0, 50)}`;
  const cached = extractionCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) { // Cache for 1 minute
    return cached.result;
  }

  const result = await extractEntitiesFromMessage(message, context, question);
  extractionCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

// Export types for use in other modules
export type { ExtractedEntity, DestinationInfo, ExtractionResult };
