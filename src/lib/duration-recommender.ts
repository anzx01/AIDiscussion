import { apiConfig } from "./api-config";

interface DurationRecommendationParams {
  destinations: Array<{ location: string; duration?: number }>;
  userQuestion: string;
  pace: "fast" | "balanced" | "relaxed";
}

/**
 * Intelligent trip duration recommendation system
 *
 * Rules:
 * 1. If user specified durations for all destinations, use the sum
 * 2. If user specified some durations, sum them + recommend for remaining
 * 3. If no durations specified, recommend based on:
 *    - Number of destinations
 *    - User's pace preference
 *    - Distance between cities (heuristic)
 */
export async function recommendTripDuration(
  params: DurationRecommendationParams
): Promise<number> {
  const { destinations, userQuestion, pace } = params;

  // Rule 1: If user specified durations for all destinations, use the sum
  const allSpecified = destinations.every(d => d.duration !== undefined);
  if (allSpecified && destinations.length > 0) {
    const totalDays = destinations.reduce((sum, d) => sum + (d.duration || 0), 0);
    console.log(`[Duration Recommender] All durations specified: ${totalDays} days`);
    return totalDays;
  }

  // Rule 2: If user specified some durations, sum them + recommend for remaining
  const specifiedDays = destinations.reduce((sum, d) => sum + (d.duration || 0), 0);
  const unspecifiedDestinations = destinations.filter(d => d.duration === undefined);

  if (unspecifiedDestinations.length > 0) {
    const recommendedDays = await recommendForDestinations(
      unspecifiedDestinations.length,
      pace,
      userQuestion
    );
    const totalDays = specifiedDays + recommendedDays;
    console.log(`[Duration Recommender] Partial specifications: ${specifiedDays} + ${recommendedDays} = ${totalDays} days`);
    return totalDays;
  }

  // Rule 3: No durations specified, recommend based on context
  const recommendedDays = await recommendForDestinations(
    destinations.length,
    pace,
    userQuestion
  );
  console.log(`[Duration Recommender] No specifications: ${recommendedDays} days for ${destinations.length} destinations`);
  return recommendedDays;
}

/**
 * Recommend duration for a given number of destinations based on pace and context
 */
async function recommendForDestinations(
  numDestinations: number,
  pace: "fast" | "balanced" | "relaxed",
  userQuestion: string
): Promise<number> {
  // Base days per destination based on pace
  const paceMultiplier = {
    fast: 1.5,      // 1.5 days per city
    balanced: 2,    // 2 days per city (default)
    relaxed: 3      // 3 days per city
  };

  let baseDays = numDestinations * paceMultiplier[pace];

  // Adjust for single destination
  if (numDestinations === 1) {
    baseDays = pace === "fast" ? 2 : pace === "balanced" ? 3 : 4;
  }

  // Use AI to refine the recommendation if not in mock mode
  if (!apiConfig.useMockApi) {
    try {
      const aiRecommendation = await getAIRecommendation(numDestinations, pace, userQuestion);
      if (aiRecommendation > 0) {
        console.log(`[Duration Recommender] AI recommended: ${aiRecommendation} days`);
        return aiRecommendation;
      }
    } catch (error) {
      console.warn("[Duration Recommender] AI recommendation failed, using heuristic:", error);
    }
  }

  // Round to nearest whole number
  const result = Math.round(baseDays);
  console.log(`[Duration Recommender] Heuristic recommendation: ${result} days`);
  return Math.max(result, 1); // Minimum 1 day
}

/**
 * Use AI to recommend trip duration based on user's question and preferences
 */
async function getAIRecommendation(
  numDestinations: number,
  pace: "fast" | "balanced" | "relaxed",
  userQuestion: string
): Promise<number> {
  try {
    const prompt = `你是一个旅行规划专家。请根据用户的问题和偏好，推荐合适的旅行天数。

用户问题：${userQuestion}
目的地数量：${numDestinations}个
旅行节奏：${pace === "fast" ? "快节奏" : pace === "balanced" ? "适中" : "慢节奏"}

请分析并推荐最合适的旅行总天数。

推荐规则：
1. 考虑目的地数量，每个城市至少需要1-2天
2. 考虑用户的节奏偏好（快节奏1-2天/城，适中2-3天/城，慢节奏3-4天/城）
3. 单个城市快节奏至少2天，适中3天，慢节奏4天
4. 只返回一个数字（天数），不要其他内容

示例：
- 1个城市，适中节奏 → 3
- 2个城市，快节奏 → 3
- 3个城市，慢节奏 → 9

请只返回推荐的数字天数：`;

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
        temperature: 0.3,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      console.warn("[Duration Recommender] AI API call failed");
      return 0;
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Extract number from response
    const match = content.match(/\d+/);
    if (match) {
      const days = parseInt(match[0]);
      if (days > 0 && days <= 30) {
        return days;
      }
    }

    return 0;
  } catch (error) {
    console.error("[Duration Recommender] AI recommendation error:", error);
    return 0;
  }
}

/**
 * Extract total trip duration from destinations
 * If durations are specified, sum them. If not, return undefined.
 */
export function extractSpecifiedDuration(
  destinations: Array<{ location: string; duration?: number }>
): number | undefined {
  const allSpecified = destinations.every(d => d.duration !== undefined);
  if (allSpecified && destinations.length > 0) {
    return destinations.reduce((sum, d) => sum + (d.duration || 0), 0);
  }
  return undefined;
}
