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
| **Current Phase** | Phase 4 — In progress |
| **Last Updated** | 2026-06-13 |
| **Last Tool Used** | Claude Code |
| **Vercel URL** | https://carepath-five.vercel.app |
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

- [x] Recommended care level — prominent, with confidence badge
- [x] Reasoning — visible, bulleted list (not hidden behind a toggle)
- [x] Risk signals — cards or tags
- [x] Cost-aware care options table (telehealth / PCP / urgent care / ER with estimated costs)
- [x] Red flags section — what would trigger escalation
- [x] MedCard section — medications and allergies from speech
- [x] "What to say at check-in" — copyable text block
- [x] "Questions to ask" — bulleted list
- [x] Safety disclaimer — visible on every page

**Status:** Done.

**What was built:**
- `src/lib/care-result-storage.ts` — `saveCareResult`/`loadCareResult` wrapping `localStorage` (key `carepath:result`).
- `src/components/SafetyDisclaimer.tsx` — shared disclaimer, now used on `/`, `/intake`, `/card`.
- `src/components/care-card/` — `care-level-styles.ts` (color tokens per `CareLevel`/`Confidence`), `CareLevelHeader.tsx`, `ListSection.tsx` (generic bulleted list, `warning` variant for red flags, returns `null` if empty), `RiskSignalTags.tsx`, `MedCard.tsx` (3-col medications/allergies/conditions), `CareOptionsTable.tsx` (highlights row matching `recommendedCareLevel`), `CheckInScript.tsx` (`"use client"`, copy-to-clipboard).
- `src/app/card/page.tsx` — reads result from `localStorage` via `loadCareResult()`; renders "No Care Card yet" + link to `/intake` if empty.
- `src/app/intake/page.tsx` — on classify success, `saveCareResult(data)` then `router.push("/card")` instead of dumping raw JSON.
- `src/app/page.tsx` — uses shared `SafetyDisclaimer`.

**Bug found + fixed during smoke test:**
- `EMERGENCY_KEYWORDS` substring match in `/api/classify` false-triggered on the Maya Patel demo transcript: CarePath's own screening question ("Are you having ... chest pain ...?") and the patient's denial ("No trouble breathing or chest pain") both contain "chest pain", causing every demo run to return `emergency_room` instead of the expected `urgent_care`.
- Fix: `extractPatientText()` now scans only `Patient:`-labeled turns (ignores the assistant's screening questions), and `hasEmergencyIndicator()` skips matches preceded by a negation word (`no`, `not`, `denies`, `without`, etc.) within the same clause.
- Re-verified via Playwright: demo flow now returns `urgent_care` / `medium` confidence, matching the documented expected result below.

**Notes / Blockers:**
- `npm run type-check` and `npm run build` both pass.
- Full demo flow (`/intake` → Run Demo Conversation → `/api/classify` → `/card`) verified end-to-end via Playwright MCP, including the emergency-keyword negation fix.

---

### Phase 3 — Landing Page + Conversation Screen Polish ⏱ ~45 min
*Goal: The full user journey feels like a product, not a prototype.*

- [x] Landing page — headline, subheadline, CTA button, disclaimer
- [x] Voice screen — visual voice indicator (orb or waveform), transcript display, end-conversation button
- [x] State flows correctly: landing → intake → card
- [x] Loading state between end-of-conversation and Care Card appearing

**Status:** Done.

**What was built:**
- `src/app/globals.css` — added `--accent`/`--accent-soft` teal design tokens (light + dark), `orb-pulse` keyframe (transform/opacity only), and a `prefers-reduced-motion` override that collapses all animations.
- `src/components/VoiceOrb.tsx` — status-driven voice indicator (`idle`/`connecting`/`active`/`ended`/`error`): pulsing ring when active, spinner ring when connecting, color/label per status, `role="status"` for a11y.
- `src/components/LoadingOverlay.tsx` — full-screen spinner overlay shown while `/api/classify` is in flight, between end-of-conversation and the Care Card appearing.
- `src/app/page.tsx` — redesigned landing page: eyebrow label, large CarePath heading, radial gradient accent background, accent CTA button, "how it works" 3-step grid (voice → care level → cost), shared `SafetyDisclaimer`.
- `src/app/intake/page.tsx` — accent-colored buttons, "Demo mode" badge in demo mode, `VoiceOrb` wired into the live-voice branch (replaces plain status text), `LoadingOverlay` shown during `classifying` for both demo and live paths.

**Notes / Blockers:**
- `npm run type-check` and `npm run build` both pass.
- Verified via Playwright MCP: landing page renders new hero/steps, `/intake` demo button → loading overlay → `/card` (Urgent Care result) all render correctly.
- Live-voice branch (`VoiceOrb` + start/stop) is implemented but still gated behind `DEMO_MODE = true` — untested live since `XAI_API_KEY` is invalid locally (see Known Issues).

---

### Phase 4 — Deploy + Demo Prep ⏱ ~30 min
*Goal: Live Vercel URL. End-to-end Maya Patel scenario runs clean.*

- [x] `npm run build` passes with no TypeScript errors
- [x] Vercel deployment live — URL confirmed working
- [x] End-to-end demo run: Maya Patel scenario (live voice OR fallback)
- [x] Fallback mode confirmed working independently
- [x] GitHub repo public, all files committed
- [ ] Submission checklist items ready (team name, one-line pitch, Vercel URL, GitHub URL)

**Status:** Mostly done — deploy + fallback demo verified, submission checklist still open.

**What was verified:**
- Production URL: **https://carepath-five.vercel.app** (project `carepath`, team `taruns-projects-248def65`). Note: the per-deployment preview URLs (`carepath-<hash>-taruns-projects-248def65.vercel.app`) are behind Vercel SSO/login — use `carepath-five.vercel.app` for demos/judges, not the preview alias.
- Latest deploy (`dpl_CEjdNaqW34jP5A3cgqEvn7Aiu2yU`, commit `0411a5e` / phase-3) is `READY` on `production`.
- Ran the Maya Patel demo flow against production via Playwright: `/intake` → Run Demo Conversation → `/api/classify` (real `gpt-4o-mini` call, `OPENAI_API_KEY` confirmed working on Vercel) → `/card` → renders `Urgent Care` / medium confidence, matching the expected scenario result.
- GitHub repo `https://github.com/TarunYadgirkar/carepath` is public, all phase-0 through phase-3 work committed and pushed.

**Notes / Blockers:**
- Submission checklist (team name, one-line pitch wording, final URL list) not yet assembled — needs input from the team for the hackathon submission form.
- Live Grok Voice path still untested end-to-end (see Known Issues — `XAI_API_KEY` invalid locally; verify against the Vercel-configured key with `DEMO_MODE = false`).

---

## Known Issues / Blockers

- **Local `XAI_API_KEY` invalid.** `curl https://api.x.ai/v1/models -H "Authorization: Bearer $XAI_API_KEY"` returns `{"code":"unauthenticated:bad-credentials"}` with the key in `.env.local`. Cannot verify the `grok-voice-think-fast-1.1` model name or test the live voice path locally. The Vercel-configured key may differ — test live voice (`DEMO_MODE = false` in `src/app/intake/page.tsx`) against the deployed app. If the model name is rejected, fall back to `grok-2-realtime` and drop `reasoning_effort` (see Phase 0 notes).

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
