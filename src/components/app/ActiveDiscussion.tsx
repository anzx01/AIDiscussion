"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ControlButton } from "./ControlButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Pause, Play, Check } from "lucide-react";
import { ImagePanel } from "@/components/chat/ImagePanel";

const agents = ["planner", "realityChecker", "budgetAdvisor"];

const agentNames: Record<string, string> = {
  planner: "GLM-4-Flash",
  realityChecker: "GLM-4-Plus",
  budgetAdvisor: "DeepSeek",
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
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["planner", "realityChecker", "budgetAdvisor"]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Stable empty callback for ChatContainer
  const handleChatComplete = useCallback(() => {
    // No-op - completion is handled by the parent's onCompleted
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll for updates (respecting pause state and completion)
  useEffect(() => {
    if (isPaused) return; // Don't poll when paused

    // Initial fetch
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/discuss/${sessionId}`);
        const data = await response.json();

        // Only update if data actually changed
        setSession((prevSession: any) => {
          if (JSON.stringify(prevSession) === JSON.stringify(data)) {
            return prevSession; // No change, don't update
          }
          return data;
        });

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

          // Only update agent states if they changed
          setAgentStates((prevStates: Record<string, AgentStatus>) => {
            if (JSON.stringify(prevStates) === JSON.stringify(latestAgentStates)) {
              return prevStates;
            }
            return latestAgentStates;
          });
        }

        // Check if completed
        if (data.status === "completed" && !isCompleted) {
          setIsCompleted(true);
          // Don't call onCompleted() to stay in the same view
        }

        // Stop polling if completed - no more updates expected
        return data.status === "completed";
      } catch (err) {
        setError("Failed to fetch progress");
        return false;
      }
    };

    // Initial fetch
    let shouldStopPolling = false;
    fetchSession().then(stop => {
      shouldStopPolling = stop;
    });

    // Only start polling if not completed
    const interval = setInterval(async () => {
      const stop = await fetchSession();
      if (stop && interval) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sessionId, isPaused]);

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

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isSending || selectedAgents.length === 0) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/discuss/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.trim(),
          selectedAgents: selectedAgents
        }),
      });

      if (response.ok) {
        setUserMessage("");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setIsSending(false);
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
    <div className="flex h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar - Compact */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Multi-Agent Discussion
              </h1>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatTime(elapsedTime)}
              </span>
              {isCompleted && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  ✓ Completed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Progress indicator */}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {getMessageCount()} messages
              </div>
              {/* Pause/Resume Button - Hide when completed */}
              {!isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPaused ? handleResume : handlePause}
                  className="flex items-center gap-1"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Bar */}
        <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 px-6 py-2 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100 truncate">
            <span className="font-semibold">Question:</span> {session?.question}
          </p>
        </div>

        {/* Agent Selection Bar */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 py-2">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Select AI models:</span>
            {agents.map((agent) => {
              const isSelected = selectedAgents.includes(agent);
              const isDone = agentStates[agent] === "done";
              const isThinking = agentStates[agent] === "thinking";

              return (
                <button
                  key={agent}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAgents(selectedAgents.filter(a => a !== agent));
                    } else {
                      setSelectedAgents([...selectedAgents, agent]);
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${isSelected
                      ? `${agentColors[agent]} text-white shadow-md`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {isSelected ? (
                      <Check className="h-3 w-3" />
                    ) : isThinking ? (
                      <span className="animate-pulse">🤔</span>
                    ) : isDone ? (
                      <span>✓</span>
                    ) : (
                      <span className="opacity-30">○</span>
                    )}
                  </span>
                  {agentNames[agent]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Container - Takes remaining space */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <ChatContainer sessionId={sessionId} status={session?.status} onComplete={handleChatComplete} />
        </div>

        {/* Bottom Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Completed Notice */}
            {isCompleted && (
              <div className="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-center">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Discussion completed! You can continue asking questions or start a new discussion.
                </p>
              </div>
            )}

            {/* Paused Notice */}
            {isPaused && !isCompleted && (
              <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 text-center">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⏸ Discussion paused - Click Resume to continue
                </p>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
              <Input
                type="text"
                placeholder={selectedAgents.length === 0
                  ? "Select at least one AI model above..."
                  : isCompleted
                  ? "Ask a follow-up question..."
                  : "Type a message to join the discussion..."}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                disabled={isSending || selectedAgents.length === 0}
                className="flex-1 h-12 text-base"
              />
              <Button
                type="submit"
                disabled={!userMessage.trim() || isSending || selectedAgents.length === 0}
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                {isSending ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>

            {/* Info text */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              {selectedAgents.length === 0
                ? "Please select at least one AI model above to send a message"
                : `Your message will be sent to: ${selectedAgents.map(a => agentNames[a]).join(", ")}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Image Panel - Fixed width on the right */}
      <div className="w-[400px] flex-shrink-0 overflow-hidden">
        <ImagePanel />
      </div>
    </div>
  );
}
