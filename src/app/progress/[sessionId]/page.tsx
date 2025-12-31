"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatContainer } from "@/components/chat/ChatContainer";

interface SessionData {
  sessionId: string;
  status: string;
  question: string;
  messages: any[];
}

const agents = ["planner", "realityChecker", "budgetAdvisor"];

const agentNames: Record<string, string> = {
  planner: "Planner",
  realityChecker: "Reality Checker",
  budgetAdvisor: "Budget Advisor",
};

const agentColors: Record<string, string> = {
  planner: "bg-blue-500",
  realityChecker: "bg-purple-500",
  budgetAdvisor: "bg-green-500",
};

type AgentStatus = "waiting" | "thinking" | "writing" | "done";

export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatus>>({
    planner: "waiting",
    realityChecker: "waiting",
    budgetAdvisor: "waiting",
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!params.sessionId) return;

    // Poll for session updates
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/discuss/${params.sessionId}`);
        const data = await response.json();
        setSession(data);

        // Update agent states based on messages
        if (data.messages && data.messages.length > 0) {
          const latestAgentStates: Record<string, AgentStatus> = {
            planner: "waiting",
            realityChecker: "waiting",
            budgetAdvisor: "waiting",
          };

          // Find last message for each agent
          agents.forEach((agent) => {
            const agentMessages = data.messages.filter((m: any) => m.agentId === agent);
            if (agentMessages.length > 0) {
              latestAgentStates[agent] = "done";
            }
          });

          // If not completed, show last active agents as thinking/writing
          if (data.status !== "completed") {
            const latestMessage = data.messages[data.messages.length - 1];
            if (latestMessage) {
              // Set all agents that have spoken as done except possibly the last one
              agents.forEach((agent) => {
                const agentHasSpoken = data.messages.some((m: any) => m.agentId === agent);
                if (agentHasSpoken) {
                  latestAgentStates[agent] = agent === latestMessage.agentId ? "thinking" : "done";
                }
              });
            }
          }

          setAgentStates(latestAgentStates);
        }
      } catch (err) {
        setError("Failed to fetch progress");
      }
    }, 500);

    return () => clearInterval(interval);
  }, [params.sessionId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getMessageCount = () => session?.messages?.length || 0;
  const getProgressPercentage = () => {
    const expectedMessages = 7; // 3 Round 1 + 3 Round 2 + 1 Round 3
    return Math.min((getMessageCount() / expectedMessages) * 100, 99);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-slate-50">
              🤖 Multi-Agent Discussion
            </h1>
            <div className="mb-4">
              <div className="text-6xl font-bold text-blue-600">{formatTime(elapsedTime)}</div>
              <p className="text-slate-600 dark:text-slate-400">
                {session.status === "completed" ? "Discussion completed!" : "AI agents are discussing..."}
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {getMessageCount()} messages • {Math.round(getProgressPercentage())}% Complete
            </p>
          </div>

          {/* Question */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-lg dark:bg-slate-900 border-2 border-blue-200">
            <h2 className="text-lg font-semibold mb-2 text-blue-600">📝 Your Question:</h2>
            <p className="text-slate-700 dark:text-slate-300">{session.question}</p>
          </div>

          {/* Agent Status Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {agents.map((agent) => (
              <div
                key={agent}
                className={`bg-white rounded-lg p-3 shadow dark:bg-slate-900 border-2 transition-all duration-300 ${
                  agentStates[agent] === "done" ? "border-green-500" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">{agentNames[agent]}</h3>
                  {agentStates[agent] === "thinking" && <span className="text-lg animate-pulse">🤔</span>}
                  {agentStates[agent] === "done" && <span className="text-lg">✅</span>}
                  {agentStates[agent] === "waiting" && <span className="text-lg opacity-30">⏳</span>}
                </div>
                {agentStates[agent] === "thinking" && (
                  <div className="w-full bg-slate-200 rounded-full h-1">
                    <div className={`${agentColors[agent]} h-1 rounded-full animate-pulse`} style={{ width: "60%" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Container */}
          <ChatContainer sessionId={String(params.sessionId)} status={session.status} onComplete={() => router.push(`/results/${params.sessionId}`)} />
        </div>
      </div>
    </div>
  );
}
