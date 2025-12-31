/**
 * Title Extractor for Discussion Sessions
 *
 * Extracts a concise, readable title from user questions
 * Examples:
 * - "Plan a 2-day trip to Paris" → "Paris 2-Day Trip"
 * - "I want to visit Tokyo for the weekend" → "Tokyo Weekend Trip"
 * - "Help me plan 3 days in London" → "London 3-Day Trip"
 */

/**
 * Extract destination name from question
 */
function extractDestination(question: string): string {
  const lowerQuestion = question.toLowerCase();

  // Pattern 1: "to [destination]"
  const toMatch = lowerQuestion.match(/\bto\s+([a-z\s]+?)(?:\s+for|\s+in|\s+during|\.|$)/i);
  if (toMatch && toMatch[1]) {
    return toMatch[1].trim();
  }

  // Pattern 2: "in [destination]"
  const inMatch = lowerQuestion.match(/\bin\s+([a-z\s]+?)(?:\s+for|\s+during|\.|$)/i);
  if (inMatch && inMatch[1]) {
    return inMatch[1].trim();
  }

  // Pattern 3: "visit [destination]"
  const visitMatch = lowerQuestion.match(/\bvisit\s+([a-z\s]+?)(?:\s+for|\s+during|\.|$)/i);
  if (visitMatch && visitMatch[1]) {
    return visitMatch[1].trim();
  }

  return "";
}

/**
 * Extract duration from question
 */
function extractDuration(question: string): string {
  const lowerQuestion = question.toLowerCase();

  // Pattern: "2-day", "3 day", "2 days", etc.
  const dayMatch = lowerQuestion.match(/(\d+)\s*-?\s*days?\b/);
  if (dayMatch) {
    return `${dayMatch[1]}-Day`;
  }

  // Pattern: "weekend"
  if (lowerQuestion.includes("weekend")) {
    return "Weekend";
  }

  // Pattern: "a week", "1 week"
  if (lowerQuestion.match(/\b1\s+week\b|\ba\s+week\b/)) {
    return "1-Week";
  }

  return "";
}

/**
 * Extract a concise title from user question
 */
export function extractTitle(question: string): string {
  // Trim and prepare question
  const trimmedQuestion = question.trim();

  // Extract components
  const destination = extractDestination(trimmedQuestion);
  const duration = extractDuration(trimmedQuestion);

  // If we have both destination and duration
  if (destination && duration) {
    // Capitalize destination
    const capitalizedDestination = destination
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return `${capitalizedDestination} ${duration} Trip`;
  }

  // If only destination
  if (destination) {
    const capitalizedDestination = destination
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    return `${capitalizedDestination} Trip`;
  }

  // If only duration
  if (duration) {
    return `${duration} Trip`;
  }

  // Fallback: use first 30 characters
  if (trimmedQuestion.length > 30) {
    return trimmedQuestion.substring(0, 30) + "...";
  }

  return trimmedQuestion;
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    // For older sessions, show date
    return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
