---
name: care-classifier
description: Implement or debug the care level classifier — the POST /api/classify route that converts a patient transcript into a structured CarePathResult JSON object. Load this skill when working on the classify API route, the system prompt, the TypeScript schema, or the Care Card data pipeline.
---

# Care Classifier

`POST /api/classify` converts a patient voice transcript into a `CarePathResult` JSON object using the OpenAI API.

---

## Route: /app/api/classify/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CarePathResult, mockCarePathResult } from "@/types/carepath";
import { syntheticPricing, DEFAULT_PLAN_KEY } from "@/data/synthetic-pricing";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { transcript, insurancePlan = DEFAULT_PLAN_KEY } = await req.json();
  if (!transcript) return NextResponse.json(mockCarePathResult);

  const plan = syntheticPricing.plans[insurancePlan] ?? syntheticPricing.plans[DEFAULT_PLAN_KEY];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, // guaranteed clean JSON
      max_tokens: 1500,
      messages: [
        { role: "system", content: buildSystemPrompt(plan) },
        { role: "user", content: transcript },
      ],
    });

    const text = response.choices[0].message.content ?? "";
    const result: CarePathResult = JSON.parse(text); // no fence-stripping needed with json_object mode

    if (!result.recommendedCareLevel || !result.reasoning?.length) throw new Error("Invalid shape");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(mockCarePathResult); // always return 200
  }
}
```

---

## Key Advantage Over Anthropic

OpenAI's `response_format: { type: "json_object" }` mode guarantees valid JSON output with no markdown fences. `JSON.parse(text)` works directly — no cleanup regex needed.

---

## System Prompt

```typescript
function buildSystemPrompt(plan: any): string {
  return `You are CarePath, a patient navigation assistant. Receive a patient voice transcript and return a JSON care navigation recommendation.

RULES:
- NOT diagnosing. Recommending WHERE to go, not what they have.
- reasoning[] must cite specific things heard from the transcript.
- Emergency indicators (chest pain, can't breathe, unconscious) → always "emergency_room".
- Return only valid JSON matching the CarePathResult type in src/types/carepath.ts.

INSURANCE PLAN (synthetic):
Plan: ${plan.name} | Deductible remaining: $${plan.deductibleRemaining}
Copays: telehealth $${plan.telehealthCopay} | PCP $${plan.pcpCopay} | urgent care $${plan.urgentCareCopay} | ER $${plan.erCopay}

CARE LEVELS (exact strings): "self_monitor" | "telehealth" | "primary_care" | "urgent_care" | "emergency_room"

Include all four careOptions. Populate reasoning[] with specific observations from the transcript.`;
}
```

---

## Critical Requirements

1. **reasoning[] must be specific** — cite what was heard. This renders on screen.
2. **All four careOptions required** — telehealth, primary_care, urgent_care, emergency_room.
3. **Never 500** — catch all errors and return `mockCarePathResult`.
4. **json_object mode** — parse directly, no cleanup needed.

---

## Fallback Chain

1. `gpt-4o-mini` — primary, fast, cheap
2. `gpt-4o` — if quality is poor
3. Grok API (OpenAI SDK compatible, add `baseURL: "https://api.x.ai/v1"`, swap key for `XAI_API_KEY`)
4. `mockCarePathResult` — if all else fails

## Install

```bash
npm install openai
```
