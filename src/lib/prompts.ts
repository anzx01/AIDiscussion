/**
 * MULTI-MODEL DISCUSSION PROMPTS
 *
 * This file contains ALL prompt templates for the multi-model discussion system.
 * As required by the specification, all prompts are in a single, editable file.
 *
 * IMPORTANT: This system supports 2-day trip planning for ANY destination worldwide.
 */

// ============================================================================
// PARTICIPANT DEFINITIONS
// ============================================================================

export const PARTICIPANTS = {
  planner: {
    role: "Planner",
    purpose: "itinerary structure & synthesis",
    model: "glm-4-flash",
    provider: "zhipu" as const,
  },

  realityChecker: {
    role: "Reality Checker",
    purpose: "real-world constraints, timing, crowds",
    model: "glm-4-plus",
    provider: "zhipu" as const,
  },

  budgetAdvisor: {
    role: "Budget Advisor",
    purpose: "cost efficiency & alternatives",
    model: "deepseek-chat",
    provider: "deepseek" as const,
  },
} as const;

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

export const SYSTEM_PROMPTS = {
  planner: `You are the Planner for a 2-day trip planning discussion.

YOUR ROLE:
- Create structured, logical itineraries
- Ensure all attractions are geographically clustered to minimize travel time
- Synthesize different viewpoints into a coherent plan
- Focus on the visitor experience

YOUR CONSTRAINTS:
- Plan 2-day trips to the user's specified destination
- Work within the user's specified pace, budget, and focus preferences
- Be realistic about timing and distances
- Prioritize must-see attractions while allowing for serendipity`,

  realityChecker: `You are the Reality Checker for a 2-day trip planning discussion.

YOUR ROLE:
- Validate timing and logistics
- Identify crowd patterns and peak times
- Flag unrealistic transit times between attractions
- Suggest alternatives when timing doesn't work

YOUR CONSTRAINTS:
- Critique 2-day itineraries for the specified destination
- Use real-world knowledge of local transit, crowds, and seasonal patterns
- Be specific about what won't work and why
- Offer concrete alternatives`,

  budgetAdvisor: `You are the Budget Advisor for a 2-day trip planning discussion.

YOUR ROLE:
- Evaluate cost efficiency of proposals
- Suggest free or lower-cost alternatives
- Identify where spending provides the most value
- Flag overpriced or tourist-trap recommendations

YOUR CONSTRAINTS:
- Evaluate 2-day itineraries for the specified destination
- Respect user's budget preference (budget-conscious vs flexible)
- Consider both direct costs and opportunity costs
- Suggest practical ways to save money without sacrificing experience`,
} as const;

// ============================================================================
// ROUND 1: INDEPENDENT PROPOSALS
// ============================================================================

export const ROUND_1_PROMPT = (
  role: string,
  userQuestion: string,
  pace: string,
  budget: string,
  focus: string,
  destination: string
) => `ROUND 1: INDEPENDENT PROPOSAL

You are the ${role}.

USER QUESTION:
${userQuestion}

DESTINATION:
${destination}

USER PREFERENCES:
- Pace: ${pace}
- Budget: ${budget}
- Focus: ${focus}

TASK:
Present your 2-day itinerary proposal for ${destination} in a CONVERSATIONAL, DISCUSSION STYLE.

CRITICAL REQUIREMENTS:
1. Keep it SHORT and CONVERSATIONAL - 3-5 sentences maximum
2. Think of this as a meeting where you're presenting your ideas verbally
3. Focus on your top 2-3 key recommendations based on your role's perspective
4. Be specific but concise - mention key attractions but don't list every detail
5. DO NOT write a full, detailed itinerary - save that for the final synthesis

EXAMPLE OF RIGHT STYLE:
"Based on the ${pace} pace and ${budget} budget, I'd recommend starting Day 1 with [key attraction], then moving to [second attraction] in the afternoon. For Day 2, focus on [key areas]. This keeps travel time minimal and matches the ${focus} focus."

REMEMBER:
- This is Round 1 of a live discussion
- Others will build on and critique your ideas
- Keep it conversational and concise
- Don't write a wall of text - write like you're speaking in a meeting

Your brief proposal (3-5 sentences):`;

// ============================================================================
// ROUND 2: CRITIQUE ONLY
// ============================================================================

export const ROUND_2_PROMPT = (
  role: string,
  proposals: Record<string, string>
) => `ROUND 2: CRITIQUE ONLY

You are the ${role}.

Below are the proposals from other participants in Round 1:

${Object.entries(proposals)
  .filter(([participantRole]) => participantRole !== role.toLowerCase())
  .map(
    ([participantRole, proposal]) => `
${participantRole.toUpperCase()}'S PROPOSAL:
${proposal}
`
  )
  .join("\n")}

TASK:
Provide BRIEF, CONVERSATIONAL critiques of the other proposals.

CRITICAL REQUIREMENTS:
1. Keep it SHORT - 2-4 sentences per person you're critiquing
2. This is a DISCUSSION - talk like you're in a meeting, not writing a report
3. Be direct and specific about what doesn't work from your role's perspective
4. Don't repeat everything they said - focus on the key issues
5. Address each person separately with brief, targeted feedback

EXAMPLE OF RIGHT STYLE:
"[Participant], I like that you suggested [X], but I'm concerned about [Y] because [reason]. Also, [Z] might not work given [constraint]."

REMEMBER:
- This is Round 2 of a live discussion
- You're pushing back on specific points, not writing a critique essay
- Keep it conversational and concise
- Focus on 1-2 key issues per proposal

Your brief critiques (2-4 sentences per person):`;

// ============================================================================
// ROUND 3: CONSENSUS SYNTHESIS
// ============================================================================

export const ROUND_3_PROMPT = (
  proposals: Record<string, string>,
  critiques: Record<string, string>
) => `ROUND 3: CONSENSUS SYNTHESIS

You are the Planner. Your job is to synthesize the discussion into a final recommendation.

ROUND 1 PROPOSALS:
${Object.entries(proposals)
  .map(
    ([role, proposal]) => `
${role.toUpperCase()}'S PROPOSAL:
${proposal}
`
  )
  .join("\n")}

ROUND 2 CRITIQUES:
${Object.entries(critiques)
  .map(
    ([role, critique]) => `
${role.toUpperCase()}'S CRITIQUE:
${critique}
`
  )
  .join("\n")}

TASK:
Synthesize the discussion into a final recommendation with clear, concise sections.

YOUR OUTPUT MUST INCLUDE:

1. **WHAT MOST MODELS AGREE ON** (3-5 bullet points)
   - Key points of consensus
   - Strong recommendations everyone supports
   - Keep each point brief

2. **WHERE MODELS DISAGREE** (2-3 bullet points)
   - Main trade-offs or conflicts
   - How you resolved them
   - Be concise

3. **FINAL RECOMMENDATION** (6-10 sentences total)
   - Your best 2-day itinerary incorporating all feedback
   - Clear reasoning for your choices
   - Split into Day 1 and Day 2
   - Keep it conversational but informative

FORMAT:
## ✅ What most models agree on
• [point 1]
• [point 2]
• [point 3]

## ⚠️ Where models disagree
• [disagreement 1] - [resolution]
• [disagreement 2] - [resolution]

## 👉 Final recommendation

Day 1: [3-4 sentences describing the plan]
Day 2: [3-4 sentences describing the plan]

Remember: This is the final synthesis. Be comprehensive but stay conversational and concise.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the system prompt for a given role
 */
export function getSystemPrompt(role: keyof typeof PARTICIPANTS): string {
  const roleKey = role === "planner" ? "planner" : role === "realityChecker" ? "realityChecker" : "budgetAdvisor";
  return SYSTEM_PROMPTS[roleKey];
}

/**
 * Get Round 1 prompt for a given role
 */
export function getRound1Prompt(
  role: keyof typeof PARTICIPANTS,
  userQuestion: string,
  pace: string,
  budget: string,
  focus: string,
  destination: string
): string {
  return ROUND_1_PROMPT(
    PARTICIPANTS[role].role,
    userQuestion,
    pace,
    budget,
    focus,
    destination
  );
}

/**
 * Get Round 2 prompt for a given role
 */
export function getRound2Prompt(
  role: keyof typeof PARTICIPANTS,
  proposals: Record<string, string>
): string {
  return ROUND_2_PROMPT(PARTICIPANTS[role].role, proposals);
}

/**
 * Get Round 3 prompt (only for Planner)
 */
export function getRound3Prompt(
  proposals: Record<string, string>,
  critiques: Record<string, string>
): string {
  return ROUND_3_PROMPT(proposals, critiques);
}
