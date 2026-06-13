# CarePath

**Your personal healthcare center. Voice first.**

> "Tell it what's wrong. It tells you where to go, what it may cost, and what to bring."

CarePath helps people answer the hardest question when they feel sick: where do I actually go? You describe your symptoms out loud and CarePath recommends a level of care, shows its reasoning and a confidence score, estimates the cost against your insurance, and builds a shareable Care Card you can bring to the provider. It also helps after a visit, tracks your medications and symptoms over time, and can pull from your existing health records.

**Live:** https://carepath-five.vercel.app
**Repo:** https://github.com/TarunYadgirkar/carepath

> **CarePath is a navigation tool, not a diagnosis system.** If you are experiencing an emergency such as trouble breathing, chest pain, or loss of consciousness, call 911 immediately.

---

## What it does

Five connected modes, all voice first:

- **Triage** — describe your symptoms and get a recommended care level (self-monitor, telehealth, primary care, urgent care, or ER) with visible reasoning, a confidence score, and a cost estimate for each option against your plan.
- **Debrief** — just left the doctor? Describe what they told you and get a plain language explanation plus next steps.
- **MedCard** — speak your medications and allergies for a shareable card and an interaction check, or scan a pill bottle label with your camera.
- **Check-in** — a short voice mental health check-in that notes what to raise with your provider.
- **Timeline** — log symptoms and events over time; your history feeds directly into triage.

Plus:
- **Care Card** — a shareable summary with care level, reasoning, cost-aware options, red flags, what to say at check-in, questions to ask, and what to bring. It can be generated from any data you have, even just your symptom timeline.
- **Records import** — a simulated SMART on FHIR import modeled on Epic MyChart to pre-fill medications, allergies, and conditions.
- **Patient communities** — relevant Reddit communities for your symptoms (via the arctic_shift API), with clear "peer experiences, not medical advice" disclaimers.
- **Web fact-check** — the voice agent can verify medical information on the web in real time while you speak.
- **Privacy by design** — all of your data lives in your browser. No database, nothing sent to a server unless you choose. 911 is never actually dialed.

---

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, light theme, WCAG AA focus
- **Voice:** Grok Voice (xAI Realtime API, OpenAI compatible) for live speech-to-speech, with a browser Web Speech API fallback
- **AI:** OpenAI `gpt-4o-mini` for triage classification, conversations, and community matching; `gpt-4o-mini` vision for the pill bottle scanner
- **Reddit data:** arctic_shift public API (no key required)
- **Records:** simulated SMART on FHIR import
- **Storage:** browser `localStorage` only, no database
- **Deployment:** Vercel

---

## Local development

```bash
npm install

cp .env.example .env.local
# Fill in:
#   OPENAI_API_KEY  (triage, conversations, communities, pill scan)
#   XAI_API_KEY     (Grok Voice + TTS)

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Scripts:

```bash
npm run dev          # dev server
npm run build        # production build
npm run start        # serve the production build
npm run type-check   # tsc --noEmit
npm run lint         # eslint
```

Node 22.x (see `.nvmrc`).

---

## Security and resilience

- API keys are server-side only and never reach the client.
- Security headers (CSP, HSTS, X-Frame-Options, and more) are set in `next.config.ts`.
- Per-IP rate limiting on all API routes (`src/proxy.ts`). Set `DISABLE_RATE_LIMIT=1` in the environment to turn it off for demos.
- Upstream AI calls have timeouts so a slow provider cannot stall the app under load.
- The triage classifier fails safe: if a call fails on a transcript with emergency signals, it escalates to the emergency room rather than downgrading.

---

## A note on data

Insurance and pricing data is **synthetic**. No real PHI is required, no real insurance APIs are called, and the Epic MyChart import is a simulation. CarePath defaults to a synthetic BlueShield Silver PPO plan for demos.

---

## Built at

Autonomous Healthcare Hackathon — Legion Health × Atlas AI — June 13, 2026

**Sponsors:** xAI · Vercel · Cursor · Inngest
