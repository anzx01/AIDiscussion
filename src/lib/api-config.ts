/**
 * API Configuration
 *
 * Supports both mock mode (for development) and real API mode.
 * Set USE_MOCK_API=false in .env to use real LLM APIs.
 */

export const apiConfig = {
  // Mode switching
  useMockApi: process.env.USE_MOCK_API !== "false", // Default to true for development

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  },

  // DeepSeek Configuration
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
  },

  // Model mappings
  models: {
    planner: process.env.PLANNER_MODEL || "gpt-4o-mini", // GPT-4o-mini
    realityChecker: process.env.REALITY_CHECKER_MODEL || "gpt-4o", // GPT-4o or Grok
    budgetAdvisor: process.env.BUDGET_ADVISOR_MODEL || "deepseek-chat", // DeepSeek Chat
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
