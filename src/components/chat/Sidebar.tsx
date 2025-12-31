"use client";

import { useRouter } from "next/navigation";
import { Menu, X, Plus } from "lucide-react";
import { useState } from "react";
import { SessionList } from "./SessionList";

interface SidebarProps {
  activeSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onNewDiscussion?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  activeSessionId,
  onSessionSelect,
  onNewDiscussion,
  isOpen: controlledIsOpen,
  onToggle,
}: SidebarProps) {
  const router = useRouter();
  // Use internal state if isOpen/onToggle not provided (for backward compatibility)
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = onToggle || (() => setInternalIsOpen(!internalIsOpen));

  const handleNewDiscussion = () => {
    if (onNewDiscussion) {
      onNewDiscussion();
    } else {
      // Default behavior: navigate to home
      router.push("/");
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      if (onToggle) {
        onToggle();
      } else {
        setInternalIsOpen(false);
      }
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={handleToggle}
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-900 p-2 text-white shadow-lg hover:bg-slate-800 dark:bg-slate-700 md:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleToggle}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed left-0 top-0 z-40 flex h-full w-72 transform flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-slate-900
        ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:relative md:translate-x-0"
        }
        `}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 border-b border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Discussions
            </h2>
            {/* Close button for mobile */}
            <button
              onClick={handleToggle}
              className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* New Discussion Button */}
          <button
            onClick={handleNewDiscussion}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Discussion
          </button>
        </div>

        {/* Session List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <SessionList
            activeSessionId={activeSessionId}
            onSessionSelect={onSessionSelect}
          />
        </div>
      </aside>
    </>
  );
}
