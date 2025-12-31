import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

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
      onClick={handleClick}
      className={`
        cursor-pointer rounded-lg p-3 transition-all duration-200
        ${
          isActive
            ? "bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/20"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        }
      `}
    >
      {/* Title and Status */}
      <div className="mb-1 flex items-center justify-between">
        <h3
          className={`text-sm font-medium truncate pr-2 ${
            isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100"
          }`}
        >
          {title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {getStatusIcon()}
        </div>
      </div>

      {/* Question Preview */}
      <p className="mb-2 truncate text-xs text-slate-600 dark:text-slate-400">
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
