# CarePath — Agent Context (Cursor + Antigravity)

**Product:** CarePath — Voice-first patient care navigation
**Pitch:** Voice conversation → care level triage → visible reasoning → cost estimate → shareable Care Card
**Tagline:** "Tell it what's wrong. It tells you where to go, what it may cost, and what to bring."
**Demo patient:** Maya Patel — BlueShield Silver PPO — fever 3 days + sore throat — see `src/mocks/`

---

## Start Here

1. Read `PROGRESS.md` — it tells you exactly what is done, what is in progress, and any blockers.
2. Do not modify `src/types/carepath.ts` without noting it in `PROGRESS.md`.
3. After any completed task or unresolved blocker: update `PROGRESS.md`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router, TypeScript |
| Styling | Tailwind CSS — utility classes only, no custom CSS files |
| Voice | Grok Voice — xAI Realtime API — WebSocket at `wss://api.x.ai/v1/realtime` |
| AI extraction | OpenAI API (`gpt-4o-mini` for speed, `gpt-4o` for quality) |
| Pricing | Synthetic hardcoded JSON in `src/data/synthetic-pricing.ts` |
| Storage | localStorage or React state — no database |
| Deployment | Vercel — live URL required for hackathon submission |

---

## Hard Rules

1. `XAI_API_KEY` and `OPENAI_API_KEY` are server-side only. Never in client components, never in `NEXT_PUBLIC_` vars.
2. Synthetic data only for insurance and pricing. No external insurance or facility APIs.
3. 911 is never dialed. The app may show a "Calling 911" UI state, but no real call is ever placed.
4. `src/types/carepath.ts` is the frozen source of truth. All components build against it.
5. Fallback demo mode (preloaded Maya Patel data) must work independently of live Grok Voice.
6. Full versioned model strings always — `gpt-4o-mini`, never `gpt4o` or bare aliases.
7. Update `PROGRESS.md` after every phase and every blocker.

---

## Core User Journey (One Flow — No Tabs)

```
Landing page
    ↓ [Start Voice Check-In button]
Voice conversation screen
    — User speaks symptoms, meds, insurance context
    — Grok Voice asks clarifying questions
    — Transcript builds on screen
    ↓ [Conversation ends]
POST /api/classify → CarePathResult JSON
    ↓
Care Card page
    — Recommended care level + reasoning
    — Risk signals
    — Cost-aware care options (synthetic data)
    — Red flags
    — MedCard (meds/allergies from speech)
    — What to say at check-in
    — Questions to ask
```

---

## File Map

```
src/
├── app/
│   ├── page.tsx                    # Landing page: headline + CTA
│   ├── intake/
│   │   └── page.tsx                # Voice conversation screen
│   ├── card/
│   │   └── page.tsx                # Final Care Card
│   └── api/
│       ├── classify/
│       │   └── route.ts            # POST: transcript → CarePathResult
│       └── realtime-token/
│           └── route.ts            # POST: ephemeral Grok Voice token
├── types/
│   └── carepath.ts                 # FROZEN schema — source of truth
├── data/
│   └── synthetic-pricing.ts        # Insurance plans + base costs
└── mocks/
    ├── demo-transcript.ts          # Maya Patel fallback transcript
    └── demo-result.ts              # Pre-computed CarePathResult (fallback)
```

---

## Environment Variables

```
XAI_API_KEY=           # xAI console — server-side only
OPENAI_API_KEY=        # OpenAI console — server-side only
```

---

## Skills Available

For Antigravity users, skills are in `.agents/skills/`:
- `grok-voice/SKILL.md` — Grok Voice WebSocket setup, ephemeral tokens, audio handling
- `care-classifier/SKILL.md` — Structured JSON extraction from transcript, system prompt, parse guidance

For Claude Code users, same skills are mirrored in `.claude/skills/`.

---

## Safety Requirement

Every page must include: *"CarePath is a navigation tool, not a diagnosis system. If you are experiencing an emergency — trouble breathing, chest pain, loss of consciousness — call 911 immediately."*

---

## Commands

```bash
npm run dev           # Local development
npm run build         # Production build
npm run type-check    # TypeScript validation
```
