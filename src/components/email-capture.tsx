"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailCaptureProps {
  sessionId: string;
}

export default function EmailCapture({ sessionId }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Capture email via API
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to capture email");
      }

      // Track email collected event
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "email_collected",
          sessionId,
          metadata: { email: email.trim() },
        }),
      });

      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save email");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-950">
        <p className="text-lg font-medium text-green-900 dark:text-green-100">
          Thanks! We'll keep you updated.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-100 p-6 dark:bg-slate-800">
      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
        Want to use this again or for other decisions?
      </h3>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Leave your email to get updates and new decision tools.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? "Saving..." : "Keep me updated"}
        </Button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
