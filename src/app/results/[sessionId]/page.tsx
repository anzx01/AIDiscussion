"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/app/AppLayout";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    console.log("[ResultsPage] Redirecting to home with session:", sessionId);
  }, [sessionId]);

  // Use AppLayout with the specific session
  return <AppLayout initialViewMode="history" initialSessionId={sessionId} />;
}
