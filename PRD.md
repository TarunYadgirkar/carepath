# CarePath — Product Requirements Document

**Hackathon:** Autonomous Healthcare Hackathon — Legion Health × Atlas AI
**Date:** June 13, 2026
**Builder:** Tarun Yadgirkar (solo)
**Build time:** ~7 hours (9 AM – 6 PM, submit by 6 PM sharp)
**Submission:** Live Vercel URL + public GitHub repo

---

## Problem

Patients don't know where to go when something is wrong. Not because information is unavailable — but because:

1. Symptom checkers tell you what you *might have*, not what to *do*.
2. Nobody factors cost into the decision. The difference between urgent care ($85) and the ER ($1,200) is invisible until after.
3. General AI (ChatGPT/Claude) gives conversational answers that evaporate — no persistent artifact, no structured output, no "bring this to the doctor."

The moment CarePath solves: patient is uncertain, possibly anxious, trying to decide if they need to go somewhere *right now* and what it will cost them.

---

## Solution

CarePath is a **voice-first patient navigation assistant**. The patient speaks. The app recommends a care path, shows why, estimates cost, and generates a shareable Care Card they can bring to the provider.

**This is not a diagnosis tool.** It helps patients decide *where to go*, not *what they have*.

---

## Core User Journey (One Flow — No Tabs)

```
1. Landing page → [Start Voice Check-In]
2. Voice conversation screen
   - Patient speaks symptoms, meds, insurance context
   - Grok Voice asks clarifying questions
   - Transcript builds in real time
3. [End conversation] → POST /api/classify
4. Care Card
   - Recommended care level (with reasoning)
   - Risk signals
   - Cost-aware care options
   - Red flags
   - MedCard (meds + allergies captured from speech)
   - What to say at check-in
   - Questions to ask
```

---

## Features — Priority Order

### 1. Voice Conversation (Core — must ship)
- Patient speaks naturally via Grok Voice (xAI Realtime API)
- AI asks 2–3 clarifying questions (breathing? chest pain? fever height? hydration?)
- Transcript displays on screen
- **Fallback mode:** preloaded Maya Patel transcript bypasses live voice — build this FIRST

### 2. Care Level Triage (Core — must ship)
- Five levels: `self_monitor` | `telehealth` | `primary_care` | `urgent_care` | `emergency_room`
- Recommendation includes confidence (low/medium/high) and reasoning array
- Reasoning MUST render on screen — it's the differentiator

### 3. Risk Signals (Core — must ship)
- Extracted from transcript: fever duration, swallowing difficulty, breathing issues, chest pain, dehydration, medication conflicts, mental health signals
- Displayed as visible tags/cards — not buried in a summary paragraph

### 4. Cost-Aware Care Options (Important — must ship)
- Synthetic insurance plan: BlueShield Silver PPO (hardcoded JSON)
- Table showing care options, medical fit, estimated cost
- Makes the product different from any symptom checker

### 5. Care Card / Debrief (Core — must ship)
- Shareable artifact — the output that makes this a product and not a chatbot
- Sections: recommended path + reasoning + cost table + red flags + MedCard + check-in script + questions

### 6. MedCard (Small — embedded in Care Card)
- Captured from speech: medications, dosages, allergies, relevant conditions
- Rendered as a clean section of the Care Card
- Not a separate product — just fields in `CarePathResult`

### 7. Share Link / QR Code (Stretch — last 30 min only)
- Static route `/card/[id]` with Care Card stored in localStorage
- Cut entirely if behind schedule

---

## Out of Scope (Do Not Build)

- Auth / login / user accounts
- Real database (use localStorage or in-memory state)
- Real insurance API lookup (synthetic data only)
- Real facility lookup (mock or omit)
- Real EHR integration
- Real 911 dialing (UI state only)
- PDF export
- Multiple insurance plans (one synthetic plan is enough for demo)
- Inbound phone calls / SMS

---

## TypeScript Schema (Frozen)

See `src/types/carepath.ts` for the full frozen schema. Do not modify without updating `PROGRESS.md`.

Key types:
- `CareLevel` — the five care options
- `CarePathResult` — the full structured output from `/api/classify`
- `CareOption` — individual care option with cost estimate

---

## Demo Scenario — Use This for Every Test

**Patient:** Maya Patel
**Plan:** BlueShield Silver PPO — $420 deductible remaining
**Meds:** Lisinopril 10mg — ibuprofen taken today
**Allergies:** None reported
**Concern:** Fever 3 days + severe sore throat + difficulty swallowing

**Voice input:**
> "I've had a fever for three days, my throat is really sore, and I can barely swallow. I'm on a Silver PPO plan and I have around $420 left on my deductible. I take lisinopril and I took ibuprofen today."

**Clarifying question:**
> "Are you having trouble breathing, chest pain, confusion, or signs of severe dehydration?"

**User response:**
> "No trouble breathing or chest pain. I can drink water, but swallowing hurts."

**Expected output:**
- Recommended: urgent care
- Reasoning: fever duration 3 days + difficulty swallowing → same-day evaluation warranted; no ER-level red flags
- Estimated cost: $85–$140
- Risk signals: fever 3 days, severe sore throat, difficulty swallowing
- MedCard: lisinopril 10mg, ibuprofen today, no known allergies

---

## Build Sequence — Time-Boxed

| Phase | Task | Time |
|---|---|---|
| 0 | Grok Voice working + fallback demo mode | 90 min |
| 1 | `/api/classify` → CarePathResult JSON | 60 min |
| 2 | Care Card UI — all sections | 90 min |
| 3 | Landing page + conversation screen polish | 45 min |
| 4 | Vercel deploy + end-to-end demo run | 30 min |
| Buffer | Fixes, polish, submission prep | 30 min |

**Rule:** Build fallback demo mode in Phase 0 before anything else. If Grok Voice breaks at 5 PM, you still have a demo.

---

## API Routes

### POST /api/realtime-token
- Calls xAI server-side to issue ephemeral token
- Returns `{ token: string }` to client
- Client uses token to open Grok Voice WebSocket

### POST /api/classify
- Body: `{ transcript: string, insurancePlan?: string }`
- Calls OpenAI API with structured extraction prompt
- Returns: `CarePathResult` JSON
- Fallback: if parse fails, returns `src/mocks/demo-result.ts`

---

## Pricing Data

See `src/data/synthetic-pricing.ts` for synthetic BlueShield Silver PPO plan and base costs. All hardcoded — no API calls.

---

## Safety / Compliance

The app is a navigation tool, not a medical device. Required disclaimers:
- "CarePath is a navigation tool, not a diagnosis system."
- "Synthetic data is used for insurance and cost estimates."
- "If you are experiencing a medical emergency — trouble breathing, chest pain, loss of consciousness — call 911 immediately."

Emergency red flag words trigger a prominent "Consider calling 911" banner: `"can't breathe"`, `"chest pain"`, `"unconscious"`, `"not responding"`, `"severe bleeding"`.

---

## Hackathon Submission Checklist

- [ ] Team name: CarePath (solo — Tarun Yadgirkar, tyadgirkar@gmail.com)
- [ ] One-line pitch (≤140 chars): "Voice-first care navigation — tell it what's wrong, it tells you where to go, what it costs, and what to bring."
- [ ] Live Vercel URL
- [ ] Public GitHub repo
- [ ] Demo: Maya Patel scenario runs end-to-end (live or fallback)

---

## Grok Voice Prize Angle

The Best Use of Grok Voice prize is stackable with placement prizes. Grok Voice must be the **core interface**, not a feature. Every interaction with CarePath flows through voice. The Care Card is the output of a voice conversation — it cannot be generated any other way in the demo. Frame it explicitly in the 3-minute pitch.

---

## 3-Minute Demo Script

1. **(30 sec)** Problem: "When something feels wrong, you don't know if you should go to the ER or wait it out — and nobody tells you what it'll cost."
2. **(90 sec)** Live demo: Maya Patel scenario — speak symptoms, AI asks clarifying questions, Care Card appears.
3. **(45 sec)** Walk through the card: care recommendation + reasoning + cost table + what to say at check-in.
4. **(15 sec)** Close: "This is what a smart friend who happens to be a doctor sounds like. It's not a diagnosis — it's clarity at the moment you need it most."
