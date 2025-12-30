"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import EmailCapture from "@/components/email-capture";

interface SessionData {
  id: string;
  question: string;
  pace: string;
  budget: string;
  focus: string;
  agreements: string;
  disagreements: string;
  recommendation: string;
  status: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());
  const [hasTracked30s, setHasTracked30s] = useState(false);
  const [hasTrackedScroll, setHasTrackedScroll] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track view time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - viewStartTime) / 1000;

      // Track 30s view
      if (elapsedSeconds >= 30 && !hasTracked30s) {
        trackEvent("discussion_viewed_over_30s");
        setHasTracked30s(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [viewStartTime, hasTracked30s]);

  // Track scroll to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || hasTrackedScroll) return;

      const scrollHeight = contentRef.current.scrollHeight;
      const scrollTop = contentRef.current.scrollTop;
      const clientHeight = contentRef.current.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - 100) {
        trackEvent("result_scrolled_to_bottom");
        setHasTrackedScroll(true);
      }
    };

    const element = contentRef.current;
    element?.addEventListener("scroll", handleScroll);
    return () => element?.removeEventListener("scroll", handleScroll);
  }, [hasTrackedScroll]);

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`/api/session/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch session");
        }
        const data = await response.json();
        setSessionData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  const trackEvent = async (
    eventType:
      | "discussion_viewed_over_30s"
      | "result_scrolled_to_bottom"
      | "parameters_adjusted"
  ) => {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        sessionId,
      }),
    });
  };

  const handleParameterChange = async () => {
    await trackEvent("parameters_adjusted");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-slate-700 dark:text-slate-300">
            Loading your results...
          </p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-lg text-red-600 dark:text-red-400">{error || "Session not found"}</p>
          <Button onClick={() => router.push("/")}>Start Over</Button>
        </div>
      </div>
    );
  }

  const agreements = JSON.parse(sessionData.agreements || "[]");
  const disagreements = JSON.parse(sessionData.disagreements || "[]");
  const recommendation = sessionData.recommendation;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header Message */}
          <div className="mb-8 rounded-lg bg-blue-50 p-6 text-blue-900 dark:bg-blue-950 dark:text-blue-100">
            <p className="text-lg font-medium italic">
              "This is what you would normally do manually — switching between
              multiple AIs. We did it for you."
            </p>
          </div>

          {/* Question Summary */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
              Your Question:
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300">
              {sessionData.question}
            </p>
            <div className="mt-2 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>Pace: {sessionData.pace}</span>
              <span>Budget: {sessionData.budget}</span>
              <span>Focus: {sessionData.focus}</span>
            </div>
          </div>

          {/* Results Content */}
          <div
            ref={contentRef}
            className="max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900"
          >
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {/* Recommendation Content */}
              <div dangerouslySetInnerHTML={{ __html: formatRecommendation(recommendation) }} />
            </div>
          </div>

          {/* External Links */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <a
              href="https://www.booking.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg bg-blue-600 p-4 text-white transition-colors hover:bg-blue-700"
            >
              <span className="font-semibold">Find Hotels on Booking.com</span>
            </a>
            <a
              href={`https://www.google.com/maps/search/New+York+attractions`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg bg-green-600 p-4 text-white transition-colors hover:bg-green-700"
            >
              <span className="font-semibold">View Attractions on Maps</span>
            </a>
            <a
              href="https://www.yelp.com/new-york"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg bg-red-600 p-4 text-white transition-colors hover:bg-red-700"
            >
              <span className="font-semibold">Find Restaurants on Yelp</span>
            </a>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <Button
              onClick={handleParameterChange}
              size="lg"
              className="flex-1 text-lg"
            >
              Adjust & Confirm
            </Button>
          </div>

          {/* Email Capture */}
          <div className="mt-12">
            <EmailCapture sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format the recommendation text into HTML
 * This preserves the markdown-like structure from the prompts
 */
function formatRecommendation(text: string): string {
  return (
    text
      // Convert headers
      .replace(/^## ✅ (.*$)/gim, "<h2 class='text-2xl font-bold mt-8 mb-4 text-green-600 dark:text-green-400'>$1</h2>")
      .replace(/^## ⚠️ (.*$)/gim, "<h2 class='text-2xl font-bold mt-8 mb-4 text-yellow-600 dark:text-yellow-400'>$1</h2>")
      .replace(/^## 👉 (.*$)/gim, "<h2 class='text-2xl font-bold mt-8 mb-4 text-blue-600 dark:text-blue-400'>$1</h2>")
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Convert bullet points
      .replace(/^- (.*)$/gim, "<li class='ml-4 mb-2'>$1</li>")
      // Convert line breaks
      .replace(/\n\n/g, "</p><p class='mb-4'>")
      .replace(/\n/g, "<br />")
  );
}
