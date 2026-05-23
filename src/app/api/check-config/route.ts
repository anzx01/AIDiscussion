import { NextResponse } from "next/server";
import { apiConfig } from "@/lib/api-config";

export async function GET() {
  const checks = {
    mode: apiConfig.useMockApi ? "MOCK" : "REAL API",
    zhipu: {
      configured: !!apiConfig.zhipu.apiKey,
      baseUrl: apiConfig.zhipu.baseUrl,
    },
    deepseek: {
      configured: !!apiConfig.deepseek.apiKey,
      baseUrl: apiConfig.deepseek.baseUrl,
    },
    warnings: [] as string[],
    recommendations: [] as string[],
  };

  // Add warnings and recommendations
  if (!apiConfig.useMockApi) {
    if (!apiConfig.zhipu.apiKey) {
      checks.warnings.push("Zhipu AI API key is not configured");
      checks.recommendations.push("Set ZHIPU_API_KEY in .env file or enable mock mode (USE_MOCK_API=true)");
    }
    if (!apiConfig.deepseek.apiKey) {
      checks.warnings.push("DeepSeek API key is not configured");
      checks.recommendations.push("Set DEEPSEEK_API_KEY in .env file or enable mock mode (USE_MOCK_API=true)");
    }
  } else {
    checks.recommendations.push("Currently using MOCK API mode. Set USE_MOCK_API=false to use real AI models.");
  }

  return NextResponse.json(checks);
}
