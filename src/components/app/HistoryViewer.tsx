"use client";

import { useEffect, useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar } from "lucide-react";

const agents = ["planner", "realityChecker", "budgetAdvisor"];

const agentNames: Record<string, string> = {
  planner: "Planner",
  realityChecker: "Reality Checker",
  budgetAdvisor: "Budget Advisor",
};

interface HistoryViewerProps {
  sessionId: string;
}

export function HistoryViewer({ sessionId }: HistoryViewerProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col h-screen bg-white dark:bg-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading discussion...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Failed to load discussion</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900">
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

      {/* Agent Status Bar - All Completed */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 py-2">
        <div className="flex items-center gap-6">
          {agents.map((agent) => (
            <div key={agent} className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {agentNames[agent]}
              </span>
              <span className="text-sm text-green-600">✅</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Container - Takes remaining space */}
      <div className="flex-1 overflow-y-auto">
        <ChatContainer sessionId={sessionId} status={session?.status} onComplete={() => {}} />
      </div>

      {/* Bottom Bar - Info */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 inline-block">
            <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              This discussion has been completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
