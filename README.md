# Multi-Model Decision App (Travel MVP)

A production-ready MVP web app that helps users make 2-day New York trip planning decisions by simulating multiple AI perspectives.

## 🎯 Purpose

Replace the user behavior of repeatedly asking multiple AIs and manually comparing answers for an important decision.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database URL and API keys.

3. Set up the database:
```bash
npm run db:generate
npm run db:migrate
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 📋 Features

- **Landing Page**: Hero copy with input form for 2-day NYC trip planning
- **Multi-Model Discussion**: 3-round discussion between AI models:
  - Planner (GPT-4o-mini): Itinerary structure & synthesis
  - Reality Checker (GPT-4o): Real-world constraints, timing, crowds
  - Budget Advisor (DeepSeek Chat): Cost efficiency & alternatives
- **Results Display**: Structured output showing agreements, disagreements, and recommendations
- **Email Capture**: Optional email collection after viewing results
- **Analytics**: Tracks user behavior events

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── results/[sessionId]/page.tsx # Results page
│   └── api/
│       ├── discuss/route.ts        # Multi-model discussion endpoint
│       ├── analytics/route.ts      # Analytics tracking
│       ├── email/route.ts          # Email capture
│       └── session/[sessionId]/route.ts # Session data
├── components/
│   ├── email-capture.tsx          # Email capture component
│   └── ui/                        # UI components
├── db/
│   ├── schema/
│   │   ├── analytics.ts           # Analytics events schema
│   │   ├── planner.ts             # Planner sessions & emails schema
│   │   └── index.ts               # Schema exports
│   └── index.ts                   # Database client
└── lib/
    ├── api-config.ts              # API configuration (mock/real modes)
    └── prompts.ts                 # All prompt templates
```

## 🔧 Configuration

### Mock Mode (Default)

The app runs in mock mode by default, using pre-generated responses for development. No API keys required.

### Real API Mode

To use real LLM APIs, set in `.env`:
```bash
USE_MOCK_API="false"
OPENAI_API_KEY="your-key"
DEEPSEEK_API_KEY="your-key"
```

## 📊 Analytics Events

The app tracks these events:
- `first_input_submitted` - User submits their question
- `discussion_viewed_over_30s` - User views results for 30+ seconds
- `parameters_adjusted` - User clicks "Adjust & Confirm"
- `result_scrolled_to_bottom` - User scrolls to bottom of results
- `email_collected` - User provides email

## 🎨 Design Principles

- **Single Focus**: Only for 2-day New York trip planning
- **No Technical Jargon**: Never expose "LLM", "agent", "model comparison"
- **User-Centric**: Make users feel like they're doing what they normally do, but faster
- **Execution via External Links**: Hotels → Booking, Attractions → Maps, Restaurants → Yelp

## 🚀 Deployment

1. Build the app:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 📝 Notes

- Token limits are enforced to control costs
- All prompts are in a single, editable file (`src/lib/prompts.ts`)
- Streaming responses are supported (required for production)
- No login required for first use
- Email capture is optional, no forced signup

## 🎯 Success Criteria

This MVP is successful if:
- Users read the discussion
- Users adjust parameters
- Some users leave an email

We do NOT optimize for:
- DAU
- Retention
- Revenue

---

Built with Next.js 16, Drizzle ORM, and TypeScript.
