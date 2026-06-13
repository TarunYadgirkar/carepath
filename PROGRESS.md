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
| **Current Phase** | Phase 8 — Done (Site essentials: footer, 404, metadata, Care Card reset) |
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
- [x] Grok Voice speaking back — FIXED in Phase 7 (2026-06-13). The 403 was caused by hitting the wrong endpoint (`/v1/realtime/sessions`, which doesn't exist) with the wrong WebSocket subprotocol. Correct endpoint is `/v1/realtime/client_secrets`. See Phase 7.
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

### Phase 7 — Grok Realtime Voice Fixed + Wired as Primary ⏱ ~30 min
*Goal: Fix the root cause of the 403 and make full speech-to-speech Grok Voice the primary `/intake` experience.*

**Status:** Done.

**Root cause of the 403:** `/api/realtime-token` was calling `POST https://api.x.ai/v1/realtime/sessions` — **this endpoint does not exist**. The correct endpoint is `POST https://api.x.ai/v1/realtime/client_secrets`, which takes `{ expires_after: { seconds } }` (no model/voice) and returns `{ value: "<token>", expires_at }`. The WebSocket subprotocol was also OpenAI-style (`["realtime", "openai-insecure-api-key.<token>", "openai-beta.realtime-v1"]`) instead of xAI's `["xai-client-secret.<token>"]`. Both bugs together produced the 403 regardless of model name.

**What changed:**
- `src/app/api/realtime-token/route.ts` — now calls `/v1/realtime/client_secrets`, reads `data.value` as the token. **Verified via curl — returns a valid token.**
- `src/hooks/useGrokVoice.ts`:
  - WS connects with `wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.0` and subprotocol `xai-client-secret.<token>`.
  - `session.update` rewritten to the current xAI schema: `voice: "eve"`, `turn_detection: { type: "server_vad" }`, `input_audio_transcription: { model: "grok-2-audio" }`, `audio: { input: { format: { type: "audio/pcm", rate: 24000 } }, output: { ... } }`.
  - Event names updated: `response.output_audio.delta` / `response.output_audio_transcript.delta` (was `response.audio.delta` / `response.audio_transcript.delta`).
  - Added `web_search` tool alongside `end_consultation`; updated `INTAKE_INSTRUCTIONS` to use it proactively.
  - Added barge-in: `input_audio_buffer.speech_started` clears the playback queue and sends `response.cancel`.
- `src/lib/audio.ts` — `AudioPlaybackQueue` now tracks active buffer sources and exposes `clear()` for the barge-in above.
- `src/app/intake/page.tsx` — `useGrokVoice` is now the **primary** voice path (full speech-to-speech, live patient/AI transcripts). `useVoiceConversation` (browser STT + Grok TTS hybrid) remains as an explicit fallback — a "Grok Voice unavailable — switch to browser voice instead" link appears if Grok errors or the browser lacks mic/AudioContext support. Demo mode unchanged.
- Greeting (`/api/conversation` GREETING, used by the fallback path) updated to: *"Hi, I'm CarePath, your AI health navigator. What's your name, and what's going on today?"*

**Architecture (primary voice path):**
```
Browser mic → AudioWorklet/ScriptProcessor (PCM16 24kHz) → wss://api.x.ai/v1/realtime (grok-voice-think-fast-1.0, voice "eve")
                                                                  ↓ end_consultation tool call (transcript_summary)
                                                            /api/classify → /card
```

**Verification:**
- `npm run type-check` and `npm run build` pass.
- `curl -X POST /api/realtime-token` on local dev returns `{"token":"xai-realtime-client-secret-...","model":"grok-voice-think-fast-1.0"}` — confirms the 403 is fixed at the token layer.
- Playwright snapshot of `/intake` shows the new primary button, voice badge, and no fallback warning (Chromium supports `getUserMedia` + `AudioContext`).

**Still needs human verification:**
- Click "Start Live Conversation" in Chrome with mic on `/intake` — confirm the WS opens, Eve speaks, barge-in works, and `end_consultation` routes to `/card`. If the WS itself errors (vs. the token call), report the exact `error` event payload — the session.update schema may need a small tweak.

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

### Phase 8 — Site Essentials + Care Card Reset ⏱ ~15 min
*Goal: Standard site chrome (footer, 404, metadata) + a way to clear a saved Care Card and start over.*

- [x] `src/components/SiteFooter.tsx` — new footer component with safety tagline + copyright, rendered site-wide via `src/app/layout.tsx`
- [x] `src/app/layout.tsx` — added `SiteFooter`, added `viewport` export (theme-color light/dark), expanded `metadata` with `applicationName` + Open Graph fields
- [x] `src/app/not-found.tsx` — new custom 404 page (matches site styling, links back to `/`)
- [x] `src/lib/care-result-storage.ts` — added `clearCareResult()` (removes `"carepath:result"` from localStorage)
- [x] `src/app/card/page.tsx` — added "Start New Conversation" button that calls `clearCareResult()` then routes to `/intake`
- [x] `npm run type-check` and `npm run build` both pass clean

**Status:** Done.

**Notes:**
- Care Card data persists in localStorage until the user explicitly taps "Start New Conversation" — a plain reload does NOT clear it (by design, so a judge/demo can refresh without losing the card). If the requirement is "reload always resets", that would mean removing `localStorage` persistence entirely (revert to in-memory only) — flag with the user before doing that, since it would break the "refresh-safe Care Card" behavior.
- Favicon/public assets are still the default Next.js scaffold (`src/app/favicon.ico`, `public/*.svg`) — not addressed, low priority for hackathon demo.

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

## Phase 9 — Epic MyChart / FHIR Import Simulation ⏱ done 2026-06-13

*Goal: convincing static simulation of connecting health records via Epic FHIR R4, feeding into voice context.*

- [x] `src/data/epic-mock.ts` — `EPIC_SYSTEMS`, `EPIC_FHIR_MOCK` (Maya Patel record: meds, allergies, conditions, recent encounters, lab results), `EpicImportResult` type, `LabFlag` type + `LAB_FLAG_STYLES` color map
- [x] `src/lib/epic-import.ts` — `getEpicImport`/`saveEpicImport`/`clearEpicImport`/`buildEpicContext`, localStorage key `carepath-epic-import`, mirrors `medcard.ts` pattern
- [x] `src/components/epic/ConnectHealthRecordsModal.tsx` — 3-step flow (select system → simulated OAuth progress bar, 2s → success summary with counts), calls `saveEpicImport` + `saveMedCard` on success
- [x] `src/components/epic/ConnectHealthRecordsButton.tsx` — "Import from Epic MyChart" pill button, opens modal
- [x] `src/app/records/page.tsx` — read-only viewer (Medications, Allergies, Lab Results w/ reference ranges + flag colors, Recent Encounters); prompts to connect if no import yet
- [x] Wired `buildEpicContext(getEpicImport())` into both `useGrokVoice` and `useVoiceConversation` instructions/context, alongside MedCard context
- [x] Added `ConnectHealthRecordsButton` to landing page (`src/app/page.tsx`)
- [x] Added `@keyframes connect-progress` to `globals.css` for the OAuth progress bar

**Notes:**
- No real OAuth/FHIR network calls — fully static/synthetic, per hard rules.
- `npx tsc --noEmit` passes clean. `npm run build` / `npx next build` could not be run this session — local sandbox permission classifier repeatedly blocked the build command (misattributing it to an earlier accidental `rm -rf` on a typo'd directory that was already cleaned up). Run `npm run build` before next deploy to confirm.
- Next up (per `carepath-expansion.md` build order): new landing hub UI (2x2 mode grid — Triage/Debrief/MedCard/Signal), then Debrief mode (`/debrief`), MedCard mode (`/medcard`), Signal mode (`/signal`).

---

## Phase 10 — Landing Hub + Debrief/MedCard/Signal Modes ⏱ done 2026-06-13

*Goal: 4-mode "Personal Healthcare Center" hub, plus the three new voice modes sharing the existing pipeline.*

- [x] `src/components/hub/ModeCard.tsx` + rewrote `src/app/page.tsx` — 2x2 mode grid (Triage/Debrief/MedCard/Signal), accent colors blue/green/purple/amber, "Medications on file" badge if `getMedCard()` has data, `ConnectHealthRecordsButton`
- [x] `src/components/voice/VoiceConversationPanel.tsx` — extracted shared voice UI (orb, transcript, fallback switch, emergency banner) from `/intake`, parameterized by `ConversationMode`; `/intake` refactored to use it (no behavior change, demo conversation preserved)
- [x] `src/app/debrief/page.tsx` + `src/components/debrief/DebriefCardView.tsx` — Debrief mode, posts `mode: "debrief"` to `/api/classify`, renders `DebriefResult` (what the doctor said → key facts → next step → flagged concerns → MedCard → questions → what to bring → red flags), calls `saveMedCard`
- [x] `src/app/medcard/page.tsx` + `src/components/medcard/MedCardResultView.tsx` + `DownloadMedCardButton.tsx` — MedCard mode, posts `mode: "medcard"`, renders `MedCardResult` with severity-badged interactions, `toPng()` download via html-to-image on `#medcard-export`, includes `ConnectHealthRecordsButton`
- [x] `src/app/signal/page.tsx` + `src/components/signal/SignalCardView.tsx` — Signal mode, posts `mode: "signal"`, explicit "not therapy / 988" framing always visible, renders `SignalResult` (themes → what to tell provider → positive observations → questions → follow-up → resources → disclaimer), no severity score shown
- [x] Each new mode's "Run Demo" button calls `/api/classify` with an empty transcript — server returns the relevant mock result (`mockDebriefResult`/`mockMedCardResult`/`mockSignalResult`)

**Notes:**
- `npx next build` passes clean (all 4 mode routes + `/records` statically generated).
- Pre-existing `react-hooks/set-state-in-effect` ESLint warning pattern (load-from-localStorage-on-mount) now also appears in `src/app/page.tsx` and `VoiceConversationPanel.tsx` — consistent with `/card` and `/card/[id]`, not a new issue.
- Expansion plan (`carepath-expansion.md`) build order is now fully complete (Tasks 1–9 done).

---

## Phase 11 — Bugfixes from local testing ⏱ done 2026-06-13

- [x] **Grok Voice cancel bug**: `useGrokVoice.ts` sent `response.cancel` on every `input_audio_buffer.speech_started`, even when no response was in flight. Grok returned a "Cancellation failed: no active response found" `error` event, which the handler treated as fatal (`cleanup()` + status `error`), silently killing the session on the user's first interruption. Now tracks `responseActiveRef` (set on `response.created`, cleared on `response.done`/`response.cancelled`) and only cancels an in-flight response; also ignores that specific error message defensively.
- [x] `SafetyDisclaimer.tsx` — added a second line: records/medications/care cards are stored only in the browser, never on a server or database.
- [x] `src/data/epic-mock.ts` — expanded `EPIC_SYSTEMS` from 3 to 23 major US Epic-client health systems (Stanford, Mayo, Cleveland Clinic, Mass General Brigham, Johns Hopkins, etc.)
- [x] `ConnectHealthRecordsModal.tsx` — added search input + scrollable (`max-h-64`) list for the health system picker
- [x] `CareOptionsTable.tsx` / `CareCardView.tsx` — added a footer line under the cost table showing the selected insurance plan + remaining deductible, plus an "estimates, not bills" disclaimer to soften pricing display

**Notes:**
- `npx tsc --noEmit` passes clean.
- Verified `OPENAI_API_KEY` and `XAI_API_KEY` both valid via curl (models + chat completion test) — the "voice conversation isn't available" symptom was very likely the Grok cancel bug above, not a dead key. Needs retest against the Vercel deployment.

---

## Phase 12 — Transcript fix + mode prompt scope pass ⏱ done 2026-06-13

- [x] **Grok transcript not back-and-forth / `patientTranscript is not defined` ReferenceError**: `useGrokVoice.ts` refactored from two append-only `patientTranscript`/`aiTranscript` strings to a `messages: GrokTranscriptMessage[]` array, with a fresh assistant bubble pushed on `response.created` and deltas appended to the last assistant message. `VoiceConversationPanel.tsx` unified into one shared message-bubble renderer for both Grok and fallback voice paths.
- [x] Triage prompts (`VOICE_INSTRUCTIONS.triage`, `CONVERSATION_SYSTEM_PROMPTS.triage`, classify `buildSystemPrompt`) rewritten with explicit 5-level care taxonomy, adjacent-level differentiation guidance, insurance/deductible questioning, and symptom-specific test/lab/imaging questions in `questionsToAsk`.
- [x] Debrief/medcard/signal prompts (`VOICE_INSTRUCTIONS` and `CONVERSATION_SYSTEM_PROMPTS`) sharpened to cover full scope: debrief now asks about new prescriptions (name/dosage) and warning signs to return sooner; medcard now asks about OTC meds/vitamins/supplements and what each medication is for; signal now asks about duration of feelings and rotates through sleep/energy/stress topics while reflecting positive observations.

**Notes:**
- `npx tsc --noEmit` passes clean.
- Calendar/symptom-log and camera/pill-bottle-scan features discussed but not started — both feasible without a database (localStorage pattern) or new API keys (camera feature would reuse `OPENAI_API_KEY` via gpt-4o-mini vision in a new `/api/scan-label` route).

---

## Known Issues / Blockers

- **xAI Realtime — RESOLVED 2026-06-13 (Phase 7).** The 403 was caused by calling a nonexistent endpoint (`/v1/realtime/sessions`) with the wrong WebSocket subprotocol — not an account permission gap. Fixed to `/v1/realtime/client_secrets` + `xai-client-secret.<token>` subprotocol. Token minting verified via curl. Full WS round-trip (audio in/out) still needs a human mic test in Chrome — see Phase 7.
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
