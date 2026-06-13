# Skill: Care Classifier

Use this skill when implementing `/app/api/classify/route.ts` or modifying how transcripts are converted to `CarePathResult` JSON.

---

## What This Route Does

`POST /api/classify` receives a patient transcript string and returns a valid `CarePathResult` JSON object.

It must:
1. Call OpenAI API with the system prompt below
2. Use JSON mode (`response_format: { type: "json_object" }`) — no markdown fences, clean parse
3. Parse the response against `src/types/carepath.ts`
4. If parsing fails: return `mockCarePathResult` from `src/types/carepath.ts` (never throw a 500)
5. **Never** expose `OPENAI_API_KEY` — server-side only

---

## Route Implementation

```typescript
// /app/api/classify/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CarePathResult, mockCarePathResult } from "@/types/carepath";
import { syntheticPricing, DEFAULT_PLAN_KEY } from "@/data/synthetic-pricing";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { transcript, insurancePlan = DEFAULT_PLAN_KEY } = await req.json();

  if (!transcript) {
    return NextResponse.json(mockCarePathResult);
  }

  const plan = syntheticPricing.plans[insurancePlan] ?? syntheticPricing.plans[DEFAULT_PLAN_KEY];

  // Emergency override — check before hitting the API
  const emergencyKeywords = [
    "can't breathe", "cannot breathe", "chest pain", "heart attack",
    "not responding", "unconscious", "severe bleeding", "stroke",
  ];
  const lower = transcript.toLowerCase();
  if (emergencyKeywords.some((kw) => lower.includes(kw))) {
    return NextResponse.json({
      ...mockCarePathResult,
      recommendedCareLevel: "emergency_room",
      confidence: "high",
      reasoning: ["Emergency indicators detected in transcript — immediate ER evaluation required."],
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, // clean JSON — no fences, no preamble
      max_tokens: 1500,
      messages: [
        { role: "system", content: buildSystemPrompt(plan) },
        { role: "user", content: transcript },
      ],
    });

    const text = response.choices[0].message.content ?? "";
    const result: CarePathResult = JSON.parse(text);

    // Basic validation
    if (!result.recommendedCareLevel || !result.reasoning?.length) {
      throw new Error("Invalid CarePathResult shape");
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Classify error — returning mock result:", err);
    return NextResponse.json(mockCarePathResult); // always return 200
  }
}
```

---

## System Prompt

```typescript
function buildSystemPrompt(plan: typeof syntheticPricing.plans[string]): string {
  return `You are CarePath, a patient navigation assistant. You receive a transcript of a voice conversation where a patient described their symptoms, medications, and concerns.

Your job is to extract all relevant information and return a structured care navigation recommendation as JSON.

IMPORTANT RULES:
- You are NOT diagnosing. You are recommending a care LEVEL (where to go), not a condition.
- Your reasoning MUST be transparent and specific — cite what you heard, not generic advice.
- All cost estimates use the patient's synthetic insurance plan provided below.
- If ANY emergency red flag appears (chest pain, trouble breathing, loss of consciousness, uncontrolled bleeding), set recommendedCareLevel to "emergency_room" immediately.

SYNTHETIC INSURANCE PLAN (use these exact values for cost estimates):
- Plan: ${plan.name}
- Deductible remaining: $${plan.deductibleRemaining}
- Telehealth copay: $${plan.telehealthCopay}
- PCP copay: $${plan.pcpCopay}
- Urgent care copay: $${plan.urgentCareCopay}
- ER copay: $${plan.erCopay}

CARE LEVELS (use exactly these strings):
- "self_monitor" — symptoms mild, patient can safely monitor at home
- "telehealth" — needs clinical input but no physical exam required
- "primary_care" — needs in-person care, not urgent within 1–2 days
- "urgent_care" — needs same-day in-person care, no life-threatening emergency
- "emergency_room" — life-threatening indicators present

Return a JSON object with exactly this structure:
{
  "patientSummary": "2-3 sentence summary of what the patient said",
  "recommendedCareLevel": "urgent_care",
  "confidence": "low | medium | high",
  "reasoning": ["specific reason citing what was heard", "another specific reason"],
  "riskSignals": ["Fever lasting 3 days", "Difficulty swallowing"],
  "redFlags": ["Develop trouble breathing", "Experience chest pain"],
  "medications": ["Lisinopril 10mg", "Ibuprofen taken today"],
  "allergies": ["None reported"],
  "conditions": [],
  "insurancePlan": "${plan.name}",
  "deductibleRemaining": ${plan.deductibleRemaining},
  "careOptions": [
    {
      "type": "telehealth",
      "label": "Telehealth",
      "medicalFit": "low",
      "waitTime": "~20 minutes",
      "estimatedCost": "$${plan.telehealthCopay} copay",
      "explanation": "why this level fits or doesn't for this patient"
    },
    {
      "type": "primary_care",
      "label": "Primary Care",
      "medicalFit": "medium",
      "waitTime": "1-2 days",
      "estimatedCost": "$${plan.pcpCopay} copay",
      "explanation": "why this level fits or doesn't"
    },
    {
      "type": "urgent_care",
      "label": "Urgent Care",
      "medicalFit": "high",
      "waitTime": "~45 minutes",
      "estimatedCost": "$${plan.urgentCareCopay}–$140",
      "explanation": "why this level fits or doesn't"
    },
    {
      "type": "emergency_room",
      "label": "Emergency Room",
      "medicalFit": "low",
      "waitTime": "2-4 hours",
      "estimatedCost": "$${plan.erCopay}–$1,200",
      "explanation": "only if red flags appear"
    }
  ],
  "questionsToAsk": ["4-5 specific questions for the provider"],
  "whatToSayAtCheckIn": "Script for what the patient says when they arrive",
  "whatToBring": ["Insurance card", "Medication list", "Photo ID"]
}`;
}
```

---

## Critical Requirements

1. **`response_format: { type: "json_object" }`** — OpenAI's JSON mode guarantees clean JSON output. No need to strip markdown fences. Just `JSON.parse(text)` directly.

2. **reasoning[] must be populated and rendered on screen.** This is the primary demo differentiator — judges need to see WHY the app made its recommendation.

3. **All four careOptions must be returned.** The cost comparison table is a core demo feature.

4. **Never return a 500.** On any parse failure, return `mockCarePathResult` from `src/types/carepath.ts`.

---

## Model Selection

- **Primary:** `gpt-4o-mini` — fast, cheap, excellent at structured JSON extraction
- **If output quality is poor:** `gpt-4o` — better reasoning, ~10x more expensive
- **Backup (if OpenAI credits run out):** Grok API is OpenAI SDK compatible — just add `baseURL: "https://api.x.ai/v1"` and swap the key for `XAI_API_KEY`. Model: check xAI docs at the event for current model name.

```typescript
// Grok backup — same OpenAI SDK, different baseURL
const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});
// Then use model: "grok-3-mini" or whatever is current
```

---

## Install

```bash
npm install openai
```
