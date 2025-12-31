/**
 * API Configuration
 *
 * Supports both mock mode (for development) and real API mode.
 * Set USE_MOCK_API=false in .env to use real LLM APIs.
 */

export const apiConfig = {
  // Mode switching
  useMockApi: process.env.USE_MOCK_API !== "false", // Default to true for development

  // Zhipu AI (智谱AI) Configuration
  zhipu: {
    apiKey: process.env.OPENAI_API_KEY || "", // Using OPENAI_API_KEY for Zhipu
    baseUrl: process.env.OPENAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
  },

  // DeepSeek Configuration
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
  },

  // Model mappings
  models: {
    planner: process.env.PLANNER_MODEL || "glm-4-flash", // Zhipu GLM-4 Flash (fast)
    realityChecker: process.env.REALITY_CHECKER_MODEL || "glm-4-plus", // Zhipu GLM-4 Plus (powerful)
    budgetAdvisor: process.env.BUDGET_ADVISOR_MODEL || "deepseek-chat", // DeepSeek Chat (cost-effective)
  },

  // Token limits for cost control
  maxTokens: {
    planner: 1000,
    realityChecker: 800,
    budgetAdvisor: 800,
    synthesis: 1500,
  },
} as const;

/**
 * Type for discussion participants
 */
export type ParticipantRole = "planner" | "realityChecker" | "budgetAdvisor";

export interface Participant {
  role: ParticipantRole;
  name: string;
  purpose: string;
  model: string;
}
