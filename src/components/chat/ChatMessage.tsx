import { DiscussionMessageType } from "@/db/schema/planner";

const AGENT_CONFIG: Record<
  string,
  { name: string; color: string; bgColor: string; avatar: string }
> = {
  planner: {
    name: "Planner",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500",
    avatar: "📋",
  },
  realityChecker: {
    name: "Reality Checker",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500",
    avatar: "🔍",
  },
  budgetAdvisor: {
    name: "Budget Advisor",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500",
    avatar: "💰",
  },
};

interface ChatMessageProps {
  message: DiscussionMessageType & {
    replyTo?: {
      agentId: string;
      content: string;
    };
  };
  showAvatar?: boolean;
}

export function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const config = AGENT_CONFIG[message.agentId] || AGENT_CONFIG.planner;
  const time = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex gap-3 mb-4 animate-fadeIn">
      {showAvatar && (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center text-white text-lg`}>
          {config.avatar}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`font-semibold ${config.color}`}>
            {config.name}
          </span>
          <span className="text-xs text-slate-500">{time}</span>
        </div>

        {/* Reply/Quote indicator */}
        {message.replyToId && message.replyTo && (
          <div className="mb-2 pl-3 border-l-2 border-slate-300 dark:border-slate-600">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              📌 回复 {AGENT_CONFIG[message.replyTo.agentId]?.name}:
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {message.replyTo.content}
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className="inline-block max-w-full">
          <div
            className={`px-4 py-2 rounded-2xl ${
              message.agentId === "planner"
                ? "bg-blue-100 dark:bg-blue-900/30 text-slate-900 dark:text-slate-100"
                : message.agentId === "realityChecker"
                ? "bg-purple-100 dark:bg-purple-900/30 text-slate-900 dark:text-slate-100"
                : "bg-green-100 dark:bg-green-900/30 text-slate-900 dark:text-slate-100"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
