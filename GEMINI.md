# CarePath — Antigravity Context

This project uses `AGENTS.md` as the primary cross-tool context file. Read that first.

---

## Antigravity-Specific Notes

**Skills directory:** `.agents/skills/` — two skills available:
- `grok-voice` — Load when working on the voice conversation screen, WebSocket integration, or audio pipeline
- `care-classifier` — Load when working on `/api/classify`, the structured JSON extraction, or the CarePathResult schema

**PROGRESS.md:** Required reading before any session. Required update after any phase or blocker.

**Manager View note:** If running parallel agents in Antigravity, do NOT let multiple agents touch `src/types/carepath.ts` simultaneously. That schema is frozen and treated as a contract.

**Browser subagent:** When testing the voice flow, note that Web Audio API and WebSocket connections may behave differently in the Antigravity browser subagent vs. a real Chrome window. If voice doesn't work in browser subagent, test via `npm run dev` in a real browser.

---

## Project Rules Reference

See `AGENTS.md` for full rules, stack, file map, and environment variables.

---

## Quick Context

```
Product:    CarePath — voice patient navigation
Demo user:  Maya Patel, BlueShield Silver PPO, fever + sore throat
Flow:       Voice intake → triage → cost estimate → Care Card
Stack:      Next.js + Tailwind + Grok Voice + OpenAI API + Vercel
Key schema: src/types/carepath.ts (frozen)
Key mocks:  src/mocks/demo-transcript.ts + demo-result.ts
```
