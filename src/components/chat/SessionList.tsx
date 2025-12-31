"use client";

import { useEffect, useState } from "react";
import { SessionItem } from "./SessionItem";
import { MessageSquare } from "lucide-react";

interface Session {
  id: string;
  title: string;
  question: string;
  status: "processing" | "completed" | "failed";
  relativeTime: string;
  messageCount: number;
}

interface SessionListProps {
  activeSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
}

export function SessionList({ activeSessionId, onSessionSelect }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sessions");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={fetchSessions}
          className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <MessageSquare className="mb-2 h-12 w-12 text-slate-300 dark:text-slate-600" />
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          No discussions yet
        </p>
        <p className="mt-1 text-center text-xs text-slate-400 dark:text-slate-500">
          Start a new trip plan to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto px-3 pb-4">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          {...session}
          isActive={session.id === activeSessionId}
          onClick={onSessionSelect}
        />
      ))}
    </div>
  );
}
