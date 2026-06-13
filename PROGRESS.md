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
| **Current Phase** | Phase 6 — Done (Grok TTS wired) |
| **Last Updated** | 2026-06-13 |
| **Last Tool Used** | Cursor |
| **Vercel URL** | https://carepath-five.vercel.app |
| **GitHub Repo** | https://github.com/TarunYadgirkar/carepath |

---

## Build Phases

### Phase 0 — Grok Voice + Fallback Demo Mode ⏱ ~90 min
*Goal: Grok Voice is speaking back. Fallback mode works independently of live voice.*

- [x] `/app/api/realtime-token/route.ts` — POST route that calls xAI and returns ephemeral token
- [x] `/app/intake/page.tsx` — Basic voice conversation screen (WebSocket connected, transcript appears)
- [ ] Grok Voice speaking back — BLOCKED, xAI account not authorized for Realtime API (403 on all model names, confirmed 2026-06-13). Superseded by Phase 5 browser-voice live conversation.
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

### Phase 5 — Real-Time Live Conversation (Browser Voice) ⏱ ~45 min
*Goal: A working live, real-time conversation path beyond the demo transcript, given xAI Realtime is account-blocked.*

**Status:** Done.

**What was built:**
- `src/app/api/conversation/route.ts` — new POST route. First call (empty `messages`) returns a fixed greeting without an OpenAI call. Subsequent calls send the running message history to `gpt-4o-mini` (`response_format: json_object`) with a system prompt that asks short, one-at-a-time intake questions and returns `{ reply, done, summary }`. `summary` is a `Patient:`/`CarePath:` transcript-style string fed straight into `/api/classify`. Missing `OPENAI_API_KEY` or any parse error returns a graceful `done: true` fallback reply instead of a 500.
- `src/hooks/useVoiceConversation.ts` — new client hook using browser-native Web Speech API: `SpeechRecognition`/`webkitSpeechRecognition` for STT, `speechSynthesis`/`SpeechSynthesisUtterance` for TTS. Conversation loop: listen → POST `/api/conversation` → speak reply → either listen again or (if `done`) call `onDone(summary)`. Handles `not-allowed`/`audio-capture`/`service-not-allowed` mic errors as fatal (surfaces a clear error message), retries on recoverable errors (e.g. `no-speech`). Exposes `isVoiceConversationSupported()` for feature detection.
- `src/components/VoiceOrb.tsx` — extended `VoiceStatus` → new exported `OrbStatus` union (`idle`/`connecting`/`active`/`listening`/`thinking`/`speaking`/`ended`/`error`) with per-status labels and pulse/spinner animation groups.
- `src/app/intake/page.tsx` — rebuilt: primary "Live conversation" card (VoiceOrb + Start/End button + live chat-bubble transcript of patient/CarePath turns), with a "Demo mode" section below as a fallback/secondary path. Feature-detects voice support client-side (`useEffect`) to avoid SSR/client mismatch; disables the live button and shows a browser-compatibility note when unsupported.
- Removed the `DEMO_MODE` flag and the `useGrokVoice` import from `/intake` — `useGrokVoice.ts`/`/api/realtime-token` remain in the repo unused, ready to be wired back in if xAI enables Realtime API access for this account.

**Notes / Blockers:**
- `npm run type-check` and `npm run build` both pass.
- Verified via Playwright: `/intake` renders the new live-conversation card + demo section; demo path still completes end-to-end to `/card` (`Urgent Care`, medium confidence).
- Live conversation itself (mic capture + speech recognition) requires a real browser with mic permission — not exercisable headlessly. Requires Chrome/Edge (Web Speech API support); Firefox/Safari fall back to the demo with an inline note.

---

### Phase 6 — Grok Voice TTS (Hybrid Voice Path) ⏱ ~30 min
*Goal: Use xAI for actual voice output while Realtime API remains account-blocked.*

**Status:** Done.

**What was built:**
- `src/app/api/tts/route.ts` — POST proxy to `https://api.x.ai/v1/tts` (voice `eve`, language `en`). Returns `audio/mpeg`. **Verified working** with rotated `XAI_API_KEY` (HTTP 200, valid mp3).
- `src/data/voice-settings.ts` — single source of truth for voice agent settings (`ttsVoiceId`, `realtimeModel`, `voiceLabel`, etc.). Update here to change voice or model names.
- `src/lib/grok-tts.ts` — client helper: `speakGrokTts()` plays `/api/tts` audio; falls back to browser `speechSynthesis` if TTS fails.
- `src/hooks/useVoiceConversation.ts` — rewired to use Grok TTS for all CarePath spoken replies (not browser TTS). Fixed greeting flow: now fetches greeting from `/api/conversation` on start and speaks it before listening. Added `speakingText` for live "CarePath is speaking…" transcript. Improved listen/speak phase tracking with `listeningRef` to avoid race conditions.
- `src/app/intake/page.tsx` — always-visible **Live transcript** panel (`aria-live="polite"`), status hints per phase, "Voice: Eve (Grok Voice)" badge, interim speech shown as `You: …` while listening.
- `src/app/api/realtime-token/route.ts` — now imports model/voice from `voice-settings.ts` (ready when xAI enables Realtime).

**Architecture (current voice path):**
```
Browser mic → Web Speech API (STT) → /api/conversation (gpt-4o-mini) → /api/tts (Grok Eve voice) → Audio playback
                                                                                    ↓ (when done)
                                                                              /api/classify → /card
```

**Notes / Blockers:**
- `npm run type-check` and `npm run build` both pass (verified by Cursor 2026-06-13).
- xAI **Realtime** (`/v1/realtime/sessions`) still 403 — not a key issue. When enabled, wire `useGrokVoice.ts` back into `/intake` (code already exists).
- xAI **TTS** (`/v1/tts`) works with current key — no new key needed for voice output.
- Live mic round-trip needs human test in Chrome/Edge on https://carepath-five.vercel.app/intake after deploy.

---

## Resume Guide (for Claude Code / next session)

**Start here:**
1. Read this file + `CLAUDE.md`
2. `git pull` — latest should include Phase 6 Grok TTS commit
3. `npm run type-check && npm run build` before any deploy

**What's working today:**
- Demo path: `/intake` → Run Demo → `/card` (Urgent Care) — verified on production
- Classify: real `gpt-4o-mini` on Vercel
- Live conversation: browser STT + Grok TTS + gpt-4o-mini conversation brain

**What needs human verification:**
- Click "Start Live Conversation" on `/intake` in Chrome with mic — confirm you hear **Eve (Grok)** voice and see live transcript update

**If Grok Realtime gets enabled on xAI console:**
- Set intake to try `useGrokVoice` first, fall back to `useVoiceConversation`
- Model already set to `grok-voice-think-fast-1.0` in `voice-settings.ts`

**Open non-code items (user handles):**
- Submission checklist (team name, pitch, URLs)

**Do NOT:**
- Commit `.env.local`
- Modify `src/types/carepath.ts` without updating this file

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

- **xAI Realtime Voice API not authorized for this account.** Key is valid for `/v1/models` and **`/v1/tts` (works — Eve voice returns mp3)**. Re-checked 2026-06-13: `POST /v1/realtime/sessions` returns `403` for all models (`grok-voice-think-fast-1.0`, `grok-2-realtime`, etc.) = team permission gap. **Workaround shipped in Phase 6:** browser STT + Grok TTS (`/api/tts`) + `gpt-4o-mini` conversation. Full speech-to-speech Realtime remains blocked until xAI enables Voice Agent API on the team — `useGrokVoice.ts` is ready to wire back in.
- **OpenAI key verified working** (rotated 2026-06-13): `GET /v1/models/gpt-4o-mini` returns 200. `/api/classify` real pipeline confirmed working on Vercel production.

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
| `src/data/voice-settings.ts` | Grok voice agent settings (TTS + Realtime) | Change voice/model here |
| `src/lib/grok-tts.ts` | Client Grok TTS playback helper | Used by useVoiceConversation |
| `src/app/api/tts/route.ts` | Grok TTS proxy (xAI /v1/tts) | Working with current XAI_API_KEY |

---

## Environment Variables Status

- [x] `XAI_API_KEY` — set in Vercel (valid for `/v1/tts` Grok Voice; Realtime API account-blocked, see Known Issues)
- [x] `OPENAI_API_KEY` — set in Vercel environment variables, verified working
- [x] `.env.local` — created locally from `.env.example`

---

## Demo Scenario (Maya Patel)

**Use this for every test run:**

User says: *"I've had a fever for three days, my throat is really sore, and I can barely swallow. I'm on a Silver PPO plan and I have around $420 left on my deductible. I take lisinopril and I took ibuprofen today."*

AI asks: *"Are you having trouble breathing, chest pain, confusion, or signs of severe dehydration?"*

User says: *"No trouble breathing or chest pain. I can drink water, but swallowing hurts."*

**Expected result:** Urgent care recommended. Reasoning cites fever duration + difficulty swallowing. No ER-level red flags. Estimated cost $85–$140 with synthetic BlueShield Silver PPO.
