import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, MoreVertical, Pencil, Pin, Share2, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface SessionItemProps {
  id: string;
  title: string;
  question: string;
  status: "processing" | "completed" | "failed";
  relativeTime: string;
  messageCount: number;
  isActive: boolean;
  onClick?: (sessionId: string) => void;
}

export function SessionItem({
  id,
  title,
  question,
  status,
  relativeTime,
  messageCount,
  isActive,
  onClick,
}: SessionItemProps) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleRename = async () => {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setIsRenaming(false);
        // Dispatch event to refresh session list
        window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId: id } }));
      }
    } catch (error) {
      console.error("Error renaming session:", error);
    }
  };

  const handlePin = async () => {
    try {
      await fetch(`/api/sessions/${id}/pin`, {
        method: "POST",
      });
      // Dispatch event to refresh session list
      window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId: id } }));
    } catch (error) {
      console.error("Error pinning session:", error);
    }
  };

  const handleShare = async () => {
    try {
      // Copy URL to clipboard
      const url = `${window.location.origin}/session/${id}`;
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing session:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this discussion?")) {
      try {
        await fetch(`/api/sessions/${id}`, {
          method: "DELETE",
        });

        // Check if we're viewing the deleted session
        const currentPath = window.location.pathname;
        if (currentPath.includes(`/results/${id}`) || currentPath.includes(`/progress/${id}`)) {
          // Navigate to home if viewing the deleted session
          router.push("/");
        } else {
          // Dispatch event to refresh session list without page reload
          window.dispatchEvent(new CustomEvent('sessionDeleted', { detail: { sessionId: id } }));
        }
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
  };

  const handleClick = () => {
    if (onClick) {
      // Use callback if provided (for inline viewing)
      onClick(id);
    } else {
      // Default behavior: navigate to progress page
      router.push(`/progress/${id}`);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "completed":
        return "Completed";
      case "processing":
        return "In progress";
      case "failed":
        return "Failed";
      default:
        return "";
    }
  };

  return (
    <div
      className={`
        group rounded-lg p-3 transition-all duration-200
        ${
          isActive
            ? "bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/20"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        }
      `}
    >
      {/* Title and Status */}
      <div className="mb-1 flex items-center justify-between">
        {isRenaming ? (
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            onBlur={handleRename}
            className="flex-1 text-sm font-medium bg-white border border-blue-500 rounded px-2 py-1 mr-2"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            onClick={handleClick}
            className={`text-sm font-medium truncate pr-2 cursor-pointer ${
              isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {title}
          </h3>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {getStatusIcon()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                className="ml-1 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePin(); }}>
                <Pin className="h-4 w-4 mr-2" />
                Pin to top
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Question Preview */}
      <p
        onClick={handleClick}
        className="mb-2 truncate text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
      >
        {question}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
        <span>{relativeTime}</span>
        <span>{messageCount} messages</span>
      </div>

      {/* Status Badge */}
      {status === "processing" && (
        <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
          {getStatusText()}
        </div>
      )}
    </div>
  );
}
