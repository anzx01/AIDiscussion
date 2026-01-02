"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { DiscussionMessageType } from "@/db/schema/planner";
import { extractEntitiesWithCacheClient } from "@/lib/client-api";

interface ChatContainerProps {
  sessionId: string;
  status: string;
  onComplete?: () => void;
}

export function ChatContainer({ sessionId, status, onComplete }: ChatContainerProps) {
  const [messages, setMessages] = useState<(DiscussionMessageType & { replyTo?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionDeleted, setSessionDeleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const processedEntities = useRef<Set<string>>(new Set()); // Track processed entities to avoid duplicate events
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Periodically clean up processed entities to avoid memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Clear processed entities every 5 minutes to allow re-processing if needed
      if (processedEntities.current.size > 0) {
        console.log("[ChatContainer] Cleaning up processed entities, count:", processedEntities.current.size);
        processedEntities.current.clear();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  // Poll for new messages
  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/discuss/${sessionId}`);

        // Handle deleted session (404)
        if (response.status === 404) {
          setSessionDeleted(true);
          setError(null);
          setLoading(false);
          // Stop polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return true; // Stop polling
        }

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
          // Process new AI messages for entity extraction
          const newMessages = messagesWithReplies.slice(lastMessageCount.current);

          // Extract entities from new AI messages and trigger image display
          newMessages.forEach(async (msg: DiscussionMessageType & { replyTo?: any }) => {
            // Only process AI assistant messages that haven't been processed yet
            if (msg.role === "assistant" && !processedMessageIds.current.has(msg.id)) {
              processedMessageIds.current.add(msg.id);

              // Extract entities (attractions, food, locations, activities)
              try {
                console.log("[ChatContainer] Extracting entities from message:", msg.content.substring(0, 100));
                // Pass the session question for context
                const entities = await extractEntitiesWithCacheClient(
                  msg.content,
                  "", // context could be previous messages if needed
                  data.question || "" // Pass the original question
                );
                console.log("[ChatContainer] Extracted entities:", entities);

                // Dispatch displayImage events for each entity
                entities.forEach((entity) => {
                  if (entity.confidence > 0.6) {
                    // Only show high-confidence entities
                    const entityKey = `${entity.keyword}-${entity.type}`;

                    // Check if we've already processed this entity
                    if (processedEntities.current.has(entityKey)) {
                      console.log("[ChatContainer] Entity already processed, skipping:", entityKey);
                      return;
                    }

                    console.log("[ChatContainer] Dispatching displayImage event:", entity);
                    processedEntities.current.add(entityKey); // Mark as processed
                    window.dispatchEvent(
                      new CustomEvent('displayImage', {
                        detail: {
                          keyword: entity.keyword,
                          type: entity.type
                        }
                      })
                    );
                  }
                });
              } catch (error) {
                console.error("[ChatContainer] Error extracting entities:", error);
              }
            }
          });

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

        // Stop polling if completed
        return data.status === "completed";
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages");
        setLoading(false);
        return false;
      }
    };

    // Initial fetch
    fetchMessages().then(shouldStop => {
      if (shouldStop && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });

    // Poll every 500ms for new messages
    intervalRef.current = setInterval(async () => {
      const shouldStop = await fetchMessages();
      if (shouldStop && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 500);

    // Listen for session deletion event
    const handleSessionDeleted = (event: CustomEvent) => {
      const deletedSessionId = event.detail?.sessionId;
      if (deletedSessionId === sessionId) {
        setSessionDeleted(true);
        setError(null);
        setLoading(false);
        // Stop polling immediately
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    window.addEventListener('sessionDeleted', handleSessionDeleted as EventListener);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('sessionDeleted', handleSessionDeleted as EventListener);
    };
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

  if (sessionDeleted) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🗑️</div>
        <p className="text-blue-900 dark:text-blue-100 font-medium mb-2">This discussion has been deleted</p>
        <p className="text-sm text-blue-700 dark:text-blue-300">Select another discussion or start a new one</p>
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
            <span className="font-medium">Discussion completed! Scroll up to see the final recommendation.</span>
          </div>
        </div>
      )}
    </div>
  );
}
