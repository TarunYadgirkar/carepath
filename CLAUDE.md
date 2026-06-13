# CarePath — Claude Code Context

**Pitch:** Voice-first patient navigation that turns symptoms, meds, and insurance context into a clear next-step Care Card.
**Tagline:** "Tell it what's wrong. It tells you where to go, what it may cost, and what to bring."

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14+ App Router, TypeScript |
| Styling | Tailwind CSS |
| Voice | Grok Voice (xAI Realtime API) — OpenAI Realtime API compatible |
| AI extraction | OpenAI API — `gpt-4o-mini` (speed) / `gpt-4o` (quality) |
| Pricing | Hardcoded synthetic JSON — `src/data/synthetic-pricing.ts` |
| Storage | localStorage / in-memory only — no database |
| Deployment | Vercel |

---

## Hard Rules — Never Violate

1. `XAI_API_KEY` and `OPENAI_API_KEY` NEVER reach the client. Server-side only in `/app/api/` routes.
2. Synthetic data ONLY for insurance and pricing. No real insurance API calls.
3. 911 is NEVER dialed. Show "Calling 911" UI state only. No real call placed ever.
4. `src/types/carepath.ts` is frozen. Do not modify without updating `PROGRESS.md`.
5. Build fallback demo mode (preloaded Maya Patel data) before polishing live voice.
6. Update `PROGRESS.md` after every completed phase AND every unresolved blocker.
7. Use full model strings only. Never bare aliases — use `gpt-4o-mini`, not `gpt4o`.

---

## File Map

```
src/app/
├── page.tsx                      # Landing page
├── intake/page.tsx               # Voice conversation screen
├── card/page.tsx                 # Final Care Card output
└── api/
    ├── classify/route.ts         # POST: transcript → CarePathResult JSON
    └── realtime-token/route.ts   # POST: issues ephemeral Grok Voice token for client

src/types/carepath.ts             # FROZEN — do not modify unilaterally
src/data/synthetic-pricing.ts     # Hardcoded insurance + cost data
src/mocks/demo-transcript.ts      # Maya Patel fallback transcript
src/mocks/demo-result.ts          # Pre-computed CarePathResult for fallback
```

---

## Commands

```bash
npm run dev           # Local dev server
npm run build         # Production build — run before deploying
npm run type-check    # TypeScript check — run before every Vercel push
```

---

## PROGRESS.md — Read First, Update Always

Read `PROGRESS.md` before starting any work. After completing any phase or hitting any blocker you cannot resolve: update `PROGRESS.md` with what is done, what is in progress, and the exact error if blocked. The next tool session begins by reading that file.

---

## Skills Available

- `.claude/skills/grok-voice/SKILL.md` — Grok Voice WebSocket integration
- `.claude/skills/care-classifier/SKILL.md` — Care level classifier + structured output

---

## Safety Requirement

Every page must display: *"CarePath is a navigation tool, not a diagnosis system. If you are experiencing an emergency — trouble breathing, chest pain, loss of consciousness — call 911 immediately."*
