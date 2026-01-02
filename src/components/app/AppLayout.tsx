"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
import { NewDiscussionForm } from "./NewDiscussionForm";
import { ActiveDiscussion } from "./ActiveDiscussion";
import { HistoryViewer } from "./HistoryViewer";

type ViewMode = "new" | "progress" | "history";

interface AppLayoutProps {
  initialViewMode?: ViewMode;
  initialSessionId?: string;
}

export function AppLayout({
  initialViewMode = "new",
  initialSessionId,
}: AppLayoutProps) {
  console.log("[AppLayout] Component rendered, initialViewMode:", initialViewMode, "initialSessionId:", initialSessionId);

  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSessionId || null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSessionSelect = async (sessionId: string) => {
    console.log("[AppLayout] Session selected:", sessionId);
    setSelectedSessionId(sessionId);

    // Fetch session to determine view mode
    try {
      const response = await fetch(`/api/discuss/${sessionId}`);
      const data = await response.json();
      console.log("[AppLayout] Session data:", data);

      if (data.status === "processing") {
        console.log("[AppLayout] Setting viewMode to 'progress'");
        setViewMode("progress");
      } else {
        console.log("[AppLayout] Setting viewMode to 'history'");
        setViewMode("history");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  const handleNewDiscussion = () => {
    setViewMode("new");
    setSelectedSessionId(null);
  };

  // Close sidebar on mobile after selecting a session
  const handleSessionSelectMobile = (sessionId: string) => {
    handleSessionSelect(sessionId);
    setSidebarOpen(false);
  };

  const handleNewDiscussionMobile = () => {
    handleNewDiscussion();
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - only show when NOT in new mode */}
      {viewMode !== "new" && (
        <Sidebar
          activeSessionId={selectedSessionId || undefined}
          onSessionSelect={handleSessionSelectMobile}
          onNewDiscussion={handleNewDiscussionMobile}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main Content Area - Render based on viewMode */}
      <div className={`flex ${viewMode === "new" ? 'flex-1 justify-center items-center' : 'flex-1 h-full'} flex`}>
        {viewMode === "new" && (
          <>
            {console.log("[AppLayout] Rendering NewDiscussionForm")}
            <NewDiscussionForm
              onDiscussionStarted={(sessionId) => {
                console.log("[AppLayout] Discussion started:", sessionId);
                setSelectedSessionId(sessionId);
                setViewMode("progress");
              }}
            />
          </>
        )}

        {viewMode === "progress" && selectedSessionId && (
          <div className="w-full h-full">
            <ActiveDiscussion
              key={selectedSessionId}
              sessionId={selectedSessionId}
              onCompleted={() => {
                console.log("[AppLayout] Discussion completed");
                setViewMode("history");
              }}
            />
          </div>
        )}

        {viewMode === "history" && selectedSessionId && (
          <div className="w-full h-full">
            <HistoryViewer key={selectedSessionId} sessionId={selectedSessionId} />
          </div>
        )}
      </div>
    </div>
  );
}
