# CarePath — Build Progress

> ## ⚠️ MANDATORY FOR ALL AI TOOLS (Claude Code / Cursor / Antigravity)
>
> **Before starting any work:** Read this file in full.
> **After completing any phase or task:** Update the relevant checkboxes and add notes.
> **If you hit a blocker you cannot resolve:** Document the exact error, what you tried, and what files are involved — then stop and save this file.
>
> The next session — whether in Claude Code, Cursor, or Antigravity — starts by reading this file. Your updates ARE the handoff.

---

## Current Status

| Field | Value |
|---|---|
| **Current Phase** | Phase 1 — Done, starting Phase 2 |
| **Last Updated** | 2026-06-13 |
| **Last Tool Used** | Claude Code |
| **Vercel URL** | Not deployed yet |
| **GitHub Repo** | https://github.com/TarunYadgirkar/carepath |

---

## Build Phases

### Phase 0 — Grok Voice + Fallback Demo Mode ⏱ ~90 min
*Goal: Grok Voice is speaking back. Fallback mode works independently of live voice.*

- [x] `/app/api/realtime-token/route.ts` — POST route that calls xAI and returns ephemeral token
- [x] `/app/intake/page.tsx` — Basic voice conversation screen (WebSocket connected, transcript appears)
- [ ] Grok Voice speaking back (say something, AI responds) — UNTESTED, needs `XAI_API_KEY` + live mic
- [x] Fallback demo mode toggle — `DEMO_MODE = true` in `/app/intake/page.tsx`, loads `src/mocks/demo-transcript.ts`
- [x] Fallback mode routes to `/api/classify` with mock transcript and displays raw JSON

**Status:** Mostly done — demo mode verified end-to-end, live voice path unverified.

**What was built:**
- Scaffolded Next.js 16 (App Router, TS, Tailwind) into project root — no `package.json` existed before this session. Copied scaffold output (package.json, tsconfig, next.config, src/app/layout+page, public/) from a temp `create-next-app` run, since create-next-app refuses to run in a non-empty dir.
- `src/lib/audio.ts` — PCM16/base64 conversion, mic capture (`startAudioCapture`), playback queue (`AudioPlaybackQueue`)
- `src/hooks/useGrokVoice.ts` — client hook: fetches ephemeral token, opens WS to `wss://api.x.ai/v1/realtime`, handles session.update, audio deltas, transcripts, `end_consultation` tool call
- `src/app/api/realtime-token/route.ts` — POST, calls `https://api.x.ai/v1/realtime/sessions` with `XAI_API_KEY`, returns `{ token, model }`. Model: `grok-voice-think-fast-1.1` (unreleased model, confirmed from event slide), `reasoning_effort: "high"` sent in session creation body and in `session.update` (see `useGrokVoice.ts`).
- `src/app/api/classify/route.ts` — Phase 0 stub: validates `transcript` string in body, always returns `mockCarePathResult`. Real OpenAI call is Phase 1 (`.claude/skills/care-classifier/SKILL.md`).
- `src/app/intake/page.tsx` — `DEMO_MODE = true` const. Demo mode: "Run Demo Conversation" button → shows `DEMO_TRANSCRIPT` → POSTs to `/api/classify` → renders raw JSON. Live mode (when `DEMO_MODE = false`): start/stop voice buttons, live patient/AI transcript panels, status/error display.
- `src/app/page.tsx` — minimal landing page with safety disclaimer + link to `/intake`.
- `.env.local` created from `.env.example` (both keys empty — gitignored).
- `npm run type-check` and `npm run build` both pass.
- Verified via dev server: `/`, `/intake` return 200; `/api/classify` returns valid `CarePathResult` JSON for a test transcript.

**Notes / Blockers:**
- Model updated to `grok-voice-think-fast-1.1` with `reasoning_effort: "high"` (was `grok-2-realtime` placeholder). If this unreleased model name is wrong/rejected by xAI, fall back to `grok-2-realtime` and drop `reasoning_effort`.
- Live Grok Voice WebSocket path (`useGrokVoice`) is implemented per `.claude/skills/grok-voice/SKILL.md` but not yet tested — requires `XAI_API_KEY` and a browser with mic access. Set `DEMO_MODE = false` in `src/app/intake/page.tsx` to test it.
- `package-lock.json` and `node_modules` now exist (Next.js 16.2.9 / React 19.2.4).

---

### Phase 1 — Core AI Pipeline ⏱ ~60 min
*Goal: A transcript (live or fallback) becomes a valid CarePathResult JSON.*

- [x] `/app/api/classify/route.ts` — accepts transcript string, returns `CarePathResult` JSON
- [x] System prompt in place (see `.claude/skills/care-classifier/SKILL.md`)
- [x] Response parses cleanly against `src/types/carepath.ts` schema
- [x] Fallback: if parse fails (or `OPENAI_API_KEY` missing), return `mockCarePathResult`
- [x] Raw JSON renders on screen via `/intake` (already wired in Phase 0)

**Status:** Done.

**What was built:**
- Real OpenAI call: `gpt-4o-mini`, `response_format: { type: "json_object" }`, system prompt from `.claude/skills/care-classifier/SKILL.md` built per synthetic insurance plan (`src/data/synthetic-pricing.ts`, default `BlueShield Silver PPO`).
- Emergency keyword pre-check (chest pain, can't breathe, unconscious, etc.) short-circuits to `emergency_room` / high confidence before calling OpenAI.
- `OPENAI_API_KEY` lazily instantiated inside the handler (not at module scope) — empty key during local build/`collectPageData` was throwing "Missing credentials" and failing `npm run build`. Missing key now returns `mockCarePathResult` directly.
- Any parse failure / invalid shape / missing key → `mockCarePathResult`, always HTTP 200.
- Verified locally (no `OPENAI_API_KEY` set): normal transcript → mock result; "I have chest pain" → `emergency_room`/`high` via keyword override.
- `npm run type-check` and `npm run build` both pass.

**Notes / Blockers:**
- Real `gpt-4o-mini` path (with live `OPENAI_API_KEY`) untested locally — key only set in Vercel env. Should be exercised on next Vercel deploy or by adding a real key to `.env.local`.

---

### Phase 2 — Care Card UI ⏱ ~90 min
*Goal: The CarePathResult renders as a polished Care Card with all sections.*

- [ ] Recommended care level — prominent, with confidence badge
- [ ] Reasoning — visible, bulleted list (not hidden behind a toggle)
- [ ] Risk signals — cards or tags
- [ ] Cost-aware care options table (telehealth / PCP / urgent care / ER with estimated costs)
- [ ] Red flags section — what would trigger escalation
- [ ] MedCard section — medications and allergies from speech
- [ ] "What to say at check-in" — copyable text block
- [ ] "Questions to ask" — bulleted list
- [ ] Safety disclaimer — visible on every page

**Status:** Not started
**Notes / Blockers:** —

---

### Phase 3 — Landing Page + Conversation Screen Polish ⏱ ~45 min
*Goal: The full user journey feels like a product, not a prototype.*

- [ ] Landing page — headline, subheadline, CTA button, disclaimer
- [ ] Voice screen — visual voice indicator (orb or waveform), transcript display, end-conversation button
- [ ] State flows correctly: landing → intake → card
- [ ] Loading state between end-of-conversation and Care Card appearing

**Status:** Not started
**Notes / Blockers:** —

---

### Phase 4 — Deploy + Demo Prep ⏱ ~30 min
*Goal: Live Vercel URL. End-to-end Maya Patel scenario runs clean.*

- [ ] `npm run build` passes with no TypeScript errors
- [ ] Vercel deployment live — URL confirmed working
- [ ] End-to-end demo run: Maya Patel scenario (live voice OR fallback)
- [ ] Fallback mode confirmed working independently
- [ ] GitHub repo public, all files committed
- [ ] Submission checklist items ready (team name, one-line pitch, Vercel URL, GitHub URL)

**Status:** Not started
**Notes / Blockers:** —

---

## Known Issues / Blockers

*None yet — update this section immediately when a blocker is encountered.*

```
[BLOCKER TEMPLATE]
Phase: X
File: src/...
Error: exact error message
What was tried:
- attempt 1
- attempt 2
Status: unresolved / resolved by [what]
```

---

## Key File Locations

| File | Purpose | Notes |
|---|---|---|
| `src/types/carepath.ts` | Frozen schema | Do not modify without updating here |
| `src/data/synthetic-pricing.ts` | Insurance + cost data | Static, no API calls |
| `src/mocks/demo-transcript.ts` | Maya Patel demo transcript | Fallback voice bypass |
| `src/mocks/demo-result.ts` | Pre-computed CarePathResult | Fallback classifier bypass |
| `.claude/skills/grok-voice/SKILL.md` | Grok Voice integration guide | Read before touching voice code |
| `.claude/skills/care-classifier/SKILL.md` | Classifier system prompt + parse guide | Read before touching /api/classify |

---

## Environment Variables Status

- [ ] `XAI_API_KEY` — set in Vercel environment variables
- [ ] `OPENAI_API_KEY` — set in Vercel environment variables
- [ ] `.env.local` — created locally from `.env.example`

---

## Demo Scenario (Maya Patel)

**Use this for every test run:**

User says: *"I've had a fever for three days, my throat is really sore, and I can barely swallow. I'm on a Silver PPO plan and I have around $420 left on my deductible. I take lisinopril and I took ibuprofen today."*

AI asks: *"Are you having trouble breathing, chest pain, confusion, or signs of severe dehydration?"*

User says: *"No trouble breathing or chest pain. I can drink water, but swallowing hurts."*

**Expected result:** Urgent care recommended. Reasoning cites fever duration + difficulty swallowing. No ER-level red flags. Estimated cost $85–$140 with synthetic BlueShield Silver PPO.
