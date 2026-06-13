# Build Guide — Symptom Calendar + Pill Bottle Camera Scan

Two new features, both buildable without a database and without new external API keys.
Read `CLAUDE.md` and `PROGRESS.md` first — same hard rules apply (no real DB, synthetic data only, `OPENAI_API_KEY`/`XAI_API_KEY` server-side only, update `PROGRESS.md` when done).

---

## Feature 1 — Symptom / Event Calendar

**Goal:** patient logs symptoms or events over time (e.g. "headache, 6/10, started 9am"), sees them on a simple calendar/timeline, and that history feeds into the triage voice agent as context (same pattern as `buildMedCardContext` / `buildEpicContext`).

### 1. Storage — `src/lib/symptom-log.ts`

Mirror `src/lib/medcard.ts`. localStorage key: `carepath-symptom-log`.

```ts
export interface SymptomEntry {
  id: string;            // crypto.randomUUID()
  date: string;          // ISO date "2026-06-13"
  time?: string;         // optional "09:00"
  label: string;         // "Headache", "Took ibuprofen", "Fever 101F"
  severity?: number;      // 1-10, optional
  notes?: string;
  createdAt: string;     // ISO timestamp
}

export interface SymptomLog {
  entries: SymptomEntry[];
}
```

Functions to implement (all client-only, `typeof window === "undefined"` guard like existing files):
- `getSymptomLog(): SymptomLog`
- `addSymptomEntry(entry: Omit<SymptomEntry, "id" | "createdAt">): SymptomEntry`
- `removeSymptomEntry(id: string): void`
- `clearSymptomLog(): void`
- `buildSymptomLogContext(log: SymptomLog): string` — same shape as `buildMedCardContext`, summarize last ~7-14 days of entries into a sentence injected into voice instructions, e.g. "Patient's recent symptom log: 6/11 Headache (6/10), 6/12 Headache (7/10), 6/13 Fever 101F. Use this context."

### 2. Page — `src/app/timeline/page.tsx`

New route `/timeline`. Client component (`"use client"`).

- Form: date picker (default today), label text input, optional severity slider 1-10, optional notes textarea, "Add entry" button → calls `addSymptomEntry`.
- List/timeline view below: group entries by date, newest first, each row shows date/time, label, severity badge, delete button (`removeSymptomEntry`).
- Simple is fine — a vertical list grouped by date headers counts as "calendar" for this scope. A full month-grid calendar is a stretch goal, not required.
- Add nav link to `/timeline` from the landing hub (`src/components/hub/ModeCard.tsx` area / `src/app/page.tsx`) — follow the existing `ModeCard` pattern for a new "Symptom Timeline" entry tile.

### 3. Wire into triage voice agent

In `src/hooks/useGrokVoice.ts`, alongside the existing:
```ts
buildMedCardContext(getMedCard()) + buildEpicContext(getEpicImport())
```
add:
```ts
+ buildSymptomLogContext(getSymptomLog())
```
Only meaningfully relevant for `mode === "triage"` and `"debrief"` but harmless to include for all — keep consistent with how medcard/epic context is already included for every mode.

Also pass the same context string into `/api/conversation` (browser fallback) — check how `CONVERSATION_SYSTEM_PROMPTS` system prompt is built server-side in `src/app/api/conversation/route.ts` and append the symptom log context there too, same as medcard/epic if already wired (check first — may need to add the pattern for all three).

### 4. Types

`src/types/carepath.ts` is FROZEN — do not add symptom log types there. `SymptomEntry`/`SymptomLog` live in `src/lib/symptom-log.ts` only, since they're local storage shape, not part of the classifier contract.

### Effort estimate
- No DB, no new API key, no server changes beyond context-string concatenation.
- ~3-4 new/edited files: `src/lib/symptom-log.ts`, `src/app/timeline/page.tsx`, edit `useGrokVoice.ts`, edit hub page for nav link, optionally edit `useVoiceConversation.ts` / `/api/conversation/route.ts` for fallback path parity.
- Half-day for a careful pass including styling consistent with existing dark/light theme tokens.

---

## Feature 2 — Camera Pill Bottle Scan (MedCard)

**Goal:** on the `/medcard` page, patient can take/upload a photo of a pill bottle label; gpt-4o-mini vision extracts medication name + dosage + frequency and adds it to their MedCard.

### 1. New API route — `src/app/api/scan-label/route.ts`

POST endpoint, server-side only (uses `OPENAI_API_KEY`, never exposed to client — same as `/api/classify`).

- Accept `{ image: string }` where `image` is a base64 data URL (`data:image/jpeg;base64,...`) from the client `<input type="file" accept="image/*" capture="environment">` or camera capture.
- Call `openai.chat.completions.create` with `model: "gpt-4o-mini"`, `response_format: { type: "json_object" }`, and a vision-capable message:
```ts
messages: [
  {
    role: "system",
    content: `You are a pill bottle label reader. Extract medication name, dosage, and frequency/instructions from the image. Return JSON: {"medicationName": string, "dosage": string, "frequency": string, "confidence": "low"|"medium"|"high"}. If the image is unreadable or not a medication label, set medicationName to "" and confidence to "low".`
  },
  {
    role: "user",
    content: [
      { type: "text", text: "Read this medication label." },
      { type: "image_url", image_url: { url: image } }
    ]
  }
]
```
- Parse JSON response, return to client. Wrap in try/catch, return `{ error: "..." }` with appropriate status on failure — follow existing error-handling style in `/api/classify/route.ts` (no silent swallow, but no mock fallback needed here since this has no offline demo requirement).
- Validate `image` is present and looks like a data URL before calling OpenAI (input validation at boundary, per project rules).

### 2. UI — new component `src/components/medcard/PillBottleScanner.tsx`

- `"use client"`. File input with `accept="image/*" capture="environment"` (opens camera on mobile, file picker on desktop).
- On file select: read as base64 via `FileReader`, POST to `/api/scan-label`, show loading state.
- On success: show extracted `medicationName` / `dosage` / `frequency` in an editable confirmation form (patient can correct OCR mistakes before saving — vision models aren't perfect on handwriting/small print).
- "Add to MedCard" button → calls `saveMedCard()` from `src/lib/medcard.ts` with the confirmed values appended to `medications` array as a formatted string (e.g. `"Lisinopril 10mg — once daily"`).
- Add this component to `src/app/medcard/page.tsx`, near the existing manual-entry / voice-entry UI — as an additional input method, not a replacement.

### 3. Privacy note

Add a line near the scanner UI consistent with the data-autonomy messaging already in `SafetyDisclaimer.tsx`: photo is sent to OpenAI for one-time text extraction and is not stored — mention this explicitly since it's the first feature that sends an image off-device.

### Effort estimate
- No DB, no new external API/service — reuses existing `OPENAI_API_KEY` (gpt-4o-mini is multimodal/vision-capable).
- ~2 new files (`/api/scan-label/route.ts`, `PillBottleScanner.tsx`) + edit `src/app/medcard/page.tsx`.
- Half-day. Main risk is OCR accuracy on real bottles — hence the editable-confirmation step before saving, not auto-save.

---

## Shared checklist for both features

- [ ] `npx tsc --noEmit` clean
- [ ] No new env vars required (reuse `OPENAI_API_KEY`)
- [ ] No database — localStorage only, matching `medcard.ts` / `epic-import.ts` conventions
- [ ] `SafetyDisclaimer` / data-autonomy messaging present on new pages
- [ ] Update `PROGRESS.md` with a new Phase entry when done
- [ ] Add nav entries to landing hub if a new route is created
