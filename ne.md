🔒 SYSTEM INSTRUCTION — Multi-Model Decision App (Travel MVP)

You are building a  **production-ready MVP web app** .

This is **not** a generic chatbot, agent framework, or AI playground.

The product solves  **one problem only** :

> Replace the user behavior of repeatedly asking multiple AIs and manually comparing answers for an important decision.

---

## 1. Scope (Strict)

### Supported scenario (ONLY):

* **2-day New York trip planning**

### Explicitly NOT supported:

* Other cities
* Medical, investment, legal advice
* Multi-day trips
* General Q&A chat

---

## 2. Core UX Principle

The user must  **feel** :

> “This app did what I normally do — asking multiple AIs — but faster and more clearly.”

Never expose:

* “LLM”
* “agent”
* “model comparison”
* internal system mechanics

---

## 3. Landing Page Copy (Must be exact)

**Hero text (3 lines):**

```
Stop asking the same question to multiple AIs.
We already did that for you.
One decision. Multiple minds.
```

**Subtitle:**

```
Designed for decisions you don’t want to get wrong.
```

---

## 4. First-Use Flow (No login required)

### Input

Single input field:

```
“What decision are you trying to make?”
```

Placeholder:

```
Plan a 2-day trip to New York
```

### Parameters (Fixed, max 3)

```
Pace: Fast | Balanced (default) | Relaxed
Budget: Budget-conscious | Flexible (default)
Focus: Experience-first (default) | Practical
```

No other settings allowed.

---

## 5. Multi-Model Discussion Logic (Hard Rules)

### Roles

```
Planner:
  purpose: itinerary structure & synthesis
  model: GPT-4o-mini

RealityChecker:
  purpose: real-world constraints, timing, crowds
  model: GPT-4o or Grok (if available)

BudgetAdvisor:
  purpose: cost efficiency & alternatives
  model: DeepSeek Chat
```

---

### Discussion Flow (Exactly 3 rounds)

#### Round 1 — Independent Proposals

* Each role produces a **full 2-day itinerary**
* No role sees any other output

#### Round 2 — Critique Only

* Each role may ONLY critique others
* No new proposals allowed

#### Round 3 — Consensus Synthesis

* Planner synthesizes
* Output must include:
  * Shared agreement
  * Disagreements
  * Final recommended plan

---

## 6. Result UI Structure (Mandatory)

Render in this exact order:

```
## ✅ What most models agree on
- bullets

## ⚠️ Where models disagree
- bullets with explanations

## 👉 Recommended 2-day itinerary
Day 1:
Day 2:
```

At the very top show this message (exact wording):

> “This is what you would normally do manually — switching between multiple AIs.
> We did it for you.”

---

## 7. Execution Layer (No payments)

Only provide  **external links** , never in-app booking:

* Hotels → Booking
* Attractions → Google Maps
* Restaurants → Yelp / OpenTable

Primary CTA:

```
Adjust & confirm
```

---

## 8. Tech Constraints

* Frontend: Next.js
* Backend: FastAPI or serverless
* Streaming responses REQUIRED (to show “discussion feeling”)
* All prompts in a single, editable file
* Strict token limits to control cost

---

## 9. Analytics Events (Must implement)

Track exactly these events:

```
first_input_submitted
discussion_viewed_over_30s
parameters_adjusted
result_scrolled_to_bottom
email_collected
```

---

## 10. Email Capture (After results only)

Prompt text:

> “Want to use this again or for other decisions?”

No forced signup.

---

## 11. Success Criteria (Do NOT optimize anything else)

This MVP is successful if:

* Users read the discussion
* Users adjust parameters
* Some users leave an email

Ignore:

* DAU
* retention
* revenue

---

## 12. Final Constraint

Do **not** generalize.
Do **not** add features.
Do **not** optimize prematurely.

Build fast. Ship. Measure interest.

---
