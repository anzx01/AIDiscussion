import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plannerSession, discussionMessage } from "@/db/schema/planner";
import { eq, asc } from "drizzle-orm";
import { apiConfig } from "@/lib/api-config";
import {
  getSystemPrompt,
  PARTICIPANTS,
} from "@/lib/prompts";

// Import callLLM from the main route
async function callLLM(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  provider: "zhipu" | "deepseek",
  maxTokens: number
): Promise<string> {
  console.log(`callLLM: provider=${provider}, model=${model}, maxTokens=${maxTokens}`);
  console.log(`callLLM: System prompt length: ${systemPrompt.length}`);
  console.log(`callLLM: User prompt length: ${userPrompt.length}`);

  if (apiConfig.useMockApi) {
    console.log("callLLM: Using mock response");
    return `[Mock ${model} response] This is a simulated response for testing purposes.`;
  }

  const config =
    provider === "zhipu"
      ? {
          baseUrl: apiConfig.zhipu.baseUrl,
          apiKey: apiConfig.zhipu.apiKey,
        }
      : {
          baseUrl: apiConfig.deepseek.baseUrl,
          apiKey: apiConfig.deepseek.apiKey,
        };

  console.log(`callLLM: Calling ${config.baseUrl}/chat/completions`);
  console.log(`callLLM: API Key exists: ${!!config.apiKey}`);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });

  console.log(`callLLM: Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`callLLM: Error response:`, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`callLLM: Success, response length: ${data.choices[0].message.content.length}`);
  return data.choices[0].message.content;
}

// Export function to trigger AI response (called by message API)
export async function triggerAIResponse(sessionId: string, userMessageId: string, selectedAgents: string[] = ["planner", "realityChecker", "budgetAdvisor"]) {
  try {
    console.log("=== triggerAIResponse called ===", { sessionId, userMessageId, selectedAgents });

    // Fetch the session
    const [session] = await db
      .select()
      .from(plannerSession)
      .where(eq(plannerSession.id, sessionId))
      .limit(1);

    if (!session) {
      console.error("Session not found:", sessionId);
      // Save error message to database
      await db.insert(discussionMessage).values({
        id: crypto.randomUUID(),
        sessionId,
        role: "assistant",
        agentId: "system",
        round: null,
        content: "⚠️ Error: Session not found. Please refresh the page.",
        replyToId: userMessageId,
      });
      return;
    }

    // Fetch all messages for this session
    const allMessages = await db
      .select()
      .from(discussionMessage)
      .where(eq(discussionMessage.sessionId, sessionId))
      .orderBy(asc(discussionMessage.createdAt));

    console.log(`Total messages in session: ${allMessages.length}`);

    // Check if AI is already processing
    const lastMessage = allMessages[allMessages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      const timeSinceLastMessage = Date.now() - new Date(lastMessage.createdAt).getTime();
      if (timeSinceLastMessage < 5000) {
        console.log("AI recently responded, skipping to avoid duplicates");
        return;
      }
    } else if (lastMessage && lastMessage.role === null) {
      const timeSinceLastMessage = Date.now() - new Date(lastMessage.createdAt).getTime();
      if (timeSinceLastMessage < 5000) {
        console.log("AI recently responded (old message), skipping to avoid duplicates");
        return;
      }
    }

    // Generate AI responses only for selected agents
    await generateAIResponses(session, allMessages, userMessageId, selectedAgents);
  } catch (error) {
    console.error("Error in triggerAIResponse:", error);
    // Save error message to database so user can see it
    try {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await db.insert(discussionMessage).values({
        id: crypto.randomUUID(),
        sessionId,
        role: "assistant",
        agentId: "system",
        round: null,
        content: `⚠️ Error: ${errorMessage}. Please check your API configuration or try again.`,
        replyToId: userMessageId,
      });
    } catch (dbError) {
      console.error("Failed to save error message:", dbError);
    }
  }
}

async function generateAIResponses(
  session: any,
  allMessages: any[],
  userMessageId: string,
  selectedAgents: string[]
) {
  // Build conversation context
  const conversationHistory = allMessages
    .filter(msg => msg.role === "user" || msg.agentId)
    .map(msg => {
      if (msg.role === "user") {
        return `User: ${msg.content}`;
      } else {
        const agentName = msg.agentId === "planner" ? "Planner" :
                         msg.agentId === "realityChecker" ? "Reality Checker" :
                         msg.agentId === "budgetAdvisor" ? "Budget Advisor" : "AI";
        return `${agentName}: ${msg.content}`;
      }
    })
    .join("\n\n");

  console.log("Conversation history length:", conversationHistory.length);
  console.log("Selected agents:", selectedAgents);

  if (apiConfig.useMockApi) {
    console.log("Using mock API for AI responses");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock responses for selected agents only
    const mockResponsesMap: Record<string, string> = {
      planner: `Thanks for your message! I understand you'd like to make some adjustments. Let me discuss this with the team.`,
      realityChecker: `From a practical standpoint, I can help you find realistic options that match your constraints.`,
      budgetAdvisor: `I'll ensure we stay within your budget while making these changes. Let me review the financial implications.`,
    };

    for (const agentId of selectedAgents) {
      const content = mockResponsesMap[agentId];
      if (content) {
        await db.insert(discussionMessage).values({
          id: crypto.randomUUID(),
          sessionId: session.id,
          role: "assistant",
          agentId,
          round: null,
          content,
          replyToId: userMessageId,
        });
      }
    }

    console.log("Mock AI responses saved for:", selectedAgents);
    return;
  }

  // Real AI responses - only for selected agents
  const systemPromptBase = `You are part of a travel planning team. The user has provided feedback on their travel plan.
You have access to the entire conversation history. Provide thoughtful, context-aware responses.

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ""}

Key parameters:
- Destination: ${session.question}
- Pace: ${session.pace}
- Budget: ${session.budget}
- Focus: ${session.focus}

The user just sent a message. Respond naturally and helpfully, considering all previous context.`;

  // Generate responses for each selected agent
  for (const agentId of selectedAgents) {
    const participant = PARTICIPANTS[agentId as keyof typeof PARTICIPANTS];
    if (!participant) {
      console.error(`Unknown agent: ${agentId}`);
      continue;
    }

    console.log(`${agentId} responding...`);

    const agentSystemPrompts: Record<string, string> = {
      planner: `${systemPromptBase}\n\nYou are the Planner - creative and organized. Focus on making the itinerary better.`,
      realityChecker: `${systemPromptBase}\n\nYou are the Reality Checker - practical and realistic. Focus on feasibility and timing.`,
      budgetAdvisor: `${systemPromptBase}\n\nYou are the Budget Advisor - financially conscious. Focus on cost-effectiveness.`,
    };

    try {
      const response = await callLLM(
        participant.model,
        agentSystemPrompts[agentId],
        `The user said: "${allMessages.find(m => m.id === userMessageId)?.content}"\n\nProvide your response.`,
        participant.provider,
        300
      );

      await db.insert(discussionMessage).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        role: "assistant",
        agentId,
        round: null,
        content: response,
        replyToId: userMessageId,
      });

      console.log(`${agentId} response saved successfully`);
    } catch (error) {
      console.error(`Error generating response for ${agentId}:`, error);
      // Save error message for this specific agent
      try {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await db.insert(discussionMessage).values({
          id: crypto.randomUUID(),
          sessionId: session.id,
          role: "assistant",
          agentId,
          round: null,
          content: `⚠️ ${agentId} failed to respond: ${errorMessage}`,
          replyToId: userMessageId,
        });
      } catch (dbError) {
        console.error(`Failed to save error message for ${agentId}:`, dbError);
      }
    }
  }

  console.log("All AI responses completed for:", selectedAgents);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    console.log("=== /api/discuss/[sessionId]/continue called ===");
    const { sessionId } = await params;
    const body = await req.json();
    const { userMessageId } = body;

    // Call the trigger function
    await triggerAIResponse(sessionId, userMessageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in continue discussion:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
