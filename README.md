# CarePath

**Voice-first patient care navigation.**

> "Tell it what's wrong. It tells you where to go, what it may cost, and what to bring."

CarePath is a voice-first patient navigation assistant for people who don't know what kind of care they need. You describe your symptoms out loud. CarePath recommends a care level, shows you its reasoning, estimates cost with your insurance, and generates a shareable Care Card you can bring to the provider.

**This is a navigation tool, not a diagnosis system.** If you are experiencing a medical emergency — trouble breathing, chest pain, or loss of consciousness — call 911 immediately.

---

## What It Does

1. **Voice conversation** — Speak naturally about symptoms, medications, and concerns. Powered by Grok Voice (xAI Realtime API).
2. **Care triage** — Recommends the right level of care: self-monitoring, telehealth, primary care, urgent care, or ER — with visible reasoning.
3. **Cost clarity** — Estimates cost for each care option using your insurance context.
4. **Care Card** — Generates a shareable card with your care path, risk signals, what to say at check-in, red flags, and questions to ask.

---

## Built At

Autonomous Healthcare Hackathon — Legion Health × Atlas AI — June 13, 2026

**Sponsors:** xAI · Vercel · Cursor · Inngest

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Voice:** Grok Voice (xAI Realtime API)
- **AI extraction:** Claude API (Anthropic)
- **Deployment:** Vercel

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in XAI_API_KEY and ANTHROPIC_API_KEY

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Note on Data

All insurance and pricing data is **synthetic**. No real PHI is required. No real insurance APIs are called. CarePath uses a hardcoded synthetic BlueShield Silver PPO plan for demo purposes.
