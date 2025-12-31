"use client";

import { useEffect, useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ControlButton } from "./ControlButton";

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

interface ActiveDiscussionProps {
  sessionId: string;
  onCompleted: () => void;
}

export function ActiveDiscussion({ sessionId, onCompleted }: ActiveDiscussionProps) {
  const [session, setSession] = useState<any>(null);
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatus>>({
    planner: "waiting",
    realityChecker: "waiting",
    budgetAdvisor: "waiting",
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll for updates (respecting pause state)
  useEffect(() => {
    if (isPaused) return; // Don't poll when paused

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/discuss/${sessionId}`);
        const data = await response.json();
        setSession(data);

        // Check pause state
        if (data.isPaused && !isPaused) {
          setIsPaused(true);
          return;
        }

        // Update agent states
        if (data.messages && data.messages.length > 0) {
          const latestAgentStates: Record<string, AgentStatus> = {
            planner: "waiting",
            realityChecker: "waiting",
            budgetAdvisor: "waiting",
          };

          agents.forEach((agent) => {
            const agentMessages = data.messages.filter((m: any) => m.agentId === agent);
            if (agentMessages.length > 0) {
              latestAgentStates[agent] = "done";
            }
          });

          if (data.status !== "completed" && !data.isPaused) {
            const latestMessage = data.messages[data.messages.length - 1];
            if (latestMessage) {
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

        // Check if completed
        if (data.status === "completed") {
          onCompleted();
        }
      } catch (err) {
        setError("Failed to fetch progress");
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sessionId, isPaused, onCompleted]);

  const handlePause = async () => {
    try {
      const response = await fetch(`/api/discuss/${sessionId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });

      if (response.ok) {
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Error pausing:", error);
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch(`/api/discuss/${sessionId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });

      if (response.ok) {
        setIsPaused(false);
      }
    } catch (error) {
      console.error("Error resuming:", error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12">
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
    const expectedMessages = 7;
    return Math.min((getMessageCount() / expectedMessages) * 100, 99);
  };

  return (
    <div className="w-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header with Timer and Control Button */}
        <div className="text-center bg-white rounded-lg p-6 shadow-lg dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                🤖 Multi-Agent Discussion
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {isPaused ? "Discussion paused" : "AI agents are discussing..."}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{formatTime(elapsedTime)}</div>
              <ControlButton
                status="processing"
                isPaused={isPaused}
                onPause={handlePause}
                onResume={handleResume}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {getMessageCount()} messages • {Math.round(getProgressPercentage())}% Complete
          </p>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg p-4 shadow dark:bg-slate-900 border-2 border-blue-200">
          <h2 className="text-lg font-semibold mb-2 text-blue-600">📝 Your Question:</h2>
          <p className="text-slate-700 dark:text-slate-300">{session.question}</p>
        </div>

        {/* Agent Status Cards */}
        <div className="grid grid-cols-3 gap-3">
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
        <ChatContainer sessionId={sessionId} status={session.status} onComplete={() => {}} />

        {/* Pause Notice */}
        {isPaused && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-4 text-center">
            <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
              ⏸ Discussion Paused - Click play button to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
