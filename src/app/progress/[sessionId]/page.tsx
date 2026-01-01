"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/app/AppLayout";

export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  useEffect(() => {
    console.log("[ProgressPage] Redirecting to home with session:", sessionId);
  }, [sessionId]);

  // Use AppLayout with the specific session in progress mode
  return <AppLayout initialViewMode="progress" initialSessionId={sessionId} />;
}
