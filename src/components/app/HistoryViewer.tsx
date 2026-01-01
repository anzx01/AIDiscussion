"use client";

import { useEffect, useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Calendar, Send, Check } from "lucide-react";
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

interface HistoryViewerProps {
  sessionId: string;
}

export function HistoryViewer({ sessionId }: HistoryViewerProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["planner", "realityChecker", "budgetAdvisor"]);
  const [userMessage, setUserMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/discuss/${sessionId}`);
        const data = await response.json();
        setSession(data);
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

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

  // Format date safely
  const formatCompletionDate = (date: string | Date | null | undefined): string => {
    if (!date) return "Unknown date";

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "Unknown date";

      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white dark:bg-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading discussion...</p>
          </div>
        </div>
        <div className="w-[400px] flex-shrink-0">
          <ImagePanel />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-white dark:bg-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Failed to load discussion</p>
        </div>
        <div className="w-[400px] flex-shrink-0">
          <ImagePanel />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Compact */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Discussion History
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>{formatCompletionDate(session.updatedAt || session.createdAt)}</span>
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
        <div className="flex-1 overflow-y-auto">
          <ChatContainer sessionId={sessionId} status={session?.status} onComplete={() => {}} />
        </div>

        {/* Bottom Bar - Input */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Completed Notice */}
            <div className="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-center">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                This discussion has been completed. You can continue the conversation!
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
              <Input
                type="text"
                placeholder={selectedAgents.length === 0
                  ? "Select at least one AI model above..."
                  : "Ask a follow-up question or provide feedback..."}
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
      <div className="w-[400px] flex-shrink-0">
        <ImagePanel />
      </div>
    </div>
  );
}
