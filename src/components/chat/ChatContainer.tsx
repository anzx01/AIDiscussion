"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { DiscussionMessageType } from "@/db/schema/planner";

interface ChatContainerProps {
  sessionId: string;
  status: string;
  onComplete?: () => void;
}

export function ChatContainer({ sessionId, status, onComplete }: ChatContainerProps) {
  const [messages, setMessages] = useState<(DiscussionMessageType & { replyTo?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/discuss/${sessionId}`);
        if (!response.ok) throw new Error("Failed to fetch messages");

        const data = await response.json();

        // Build reply-to relationships
        const messagesWithReplies = (data.messages || []).map((msg: DiscussionMessageType) => {
          let replyTo;
          if (msg.replyToId) {
            // Find the message being replied to
            replyTo = (data.messages || []).find((m: DiscussionMessageType) => m.id === msg.replyToId);
          }
          return { ...msg, replyTo };
        });

        // Only update if there are new messages
        if (messagesWithReplies.length > lastMessageCount.current) {
          setMessages(messagesWithReplies);
          lastMessageCount.current = messagesWithReplies.length;
        }

        setLoading(false);

        // Check if discussion is complete
        if (data.status === "completed" && onComplete) {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMessages();

    // Poll every 500ms for new messages
    const interval = setInterval(fetchMessages, 500);

    return () => clearInterval(interval);
  }, [sessionId, onComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">💭</div>
        <p className="text-slate-600 dark:text-slate-400">
          Waiting for AI agents to start discussing...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-inner p-4 max-h-[600px] overflow-y-auto">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />

      {/* Completion indicator */}
      {status === "completed" && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full">
            <span className="text-xl">✅</span>
            <span className="font-medium">Discussion completed! Redirecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
