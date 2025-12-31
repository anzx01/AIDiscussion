"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ControlButton } from "./ControlButton";

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
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-red-500">Failed to load discussion</p>
      </div>
    );
  }

  const handleNew = () => {
    router.push("/");
  };

  return (
    <div className="w-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-lg dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                📜 Discussion History
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Completed on {new Date(session.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <ControlButton status="completed" isPaused={false} onNew={handleNew} />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg p-6 shadow dark:bg-slate-900 border-2 border-blue-200">
          <h2 className="text-lg font-semibold mb-2 text-blue-600">📝 Your Question:</h2>
          <p className="text-slate-700 dark:text-slate-300">{session.question}</p>
        </div>

        {/* Agent Status Cards - Static */}
        <div className="grid grid-cols-3 gap-3">
          {agents.map((agent) => (
            <div
              key={agent}
              className="bg-white rounded-lg p-3 shadow dark:bg-slate-900 border-2 border-green-500"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{agentNames[agent]}</h3>
                <span className="text-lg">✅</span>
              </div>
              <p className="text-xs text-green-600 font-medium">Completed</p>
            </div>
          ))}
        </div>

        {/* Chat Messages */}
        <ChatContainer sessionId={sessionId} status={session.status} onComplete={() => {}} />
      </div>
    </div>
  );
}
