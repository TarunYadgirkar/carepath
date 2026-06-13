import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CarePathResult, mockCarePathResult } from "@/types/carepath";
import { syntheticPricing, DEFAULT_PLAN_KEY, type InsurancePlan } from "@/data/synthetic-pricing";

const EMERGENCY_KEYWORDS = [
  "can't breathe",
  "cannot breathe",
  "chest pain",
  "heart attack",
  "not responding",
  "unconscious",
  "severe bleeding",
  "stroke",
];

const NEGATION_WORDS = ["no", "not", "denies", "denying", "without", "never", "negative for"];

// Transcripts interleave "Patient:" and "CarePath:" turns. The assistant's
// screening questions ("Are you having chest pain?") contain the same
// keywords as a real emergency report, so only the patient's own words are
// scanned. Falls back to the full transcript if no speaker labels are present.
function extractPatientText(transcript: string): string {
  const matches = transcript.match(/patient:([^]*?)(?=\n\s*\w+:|$)/gi);
  if (!matches) return transcript;
  return matches.join("\n");
}

// Avoids false positives like "No trouble breathing or chest pain" being read
// as an active emergency — only flags keywords not preceded by a negation
// within the same clause.
function hasEmergencyIndicator(transcript: string): boolean {
  const lower = extractPatientText(transcript).toLowerCase();

  return EMERGENCY_KEYWORDS.some((keyword) => {
    let fromIndex = 0;
    while (true) {
      const matchIndex = lower.indexOf(keyword, fromIndex);
      if (matchIndex === -1) return false;

      const clauseStart = Math.max(
        lower.lastIndexOf(".", matchIndex),
        lower.lastIndexOf(",", matchIndex),
        lower.lastIndexOf("\n", matchIndex)
      );
      const clause = lower.slice(clauseStart + 1, matchIndex);

      const negated = NEGATION_WORDS.some((neg) => clause.includes(neg));
      if (!negated) return true;

      fromIndex = matchIndex + keyword.length;
    }
  });
}

function buildSystemPrompt(plan: InsurancePlan): string {
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
- "primary_care" — needs in-person care, not urgent within 1-2 days
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
      "estimatedCost": "$${plan.urgentCareCopay}-$140",
      "explanation": "why this level fits or doesn't"
    },
    {
      "type": "emergency_room",
      "label": "Emergency Room",
      "medicalFit": "low",
      "waitTime": "2-4 hours",
      "estimatedCost": "$${plan.erCopay}-$1,200",
      "explanation": "only if red flags appear"
    }
  ],
  "questionsToAsk": ["4-5 specific questions for the provider"],
  "whatToSayAtCheckIn": "Script for what the patient says when they arrive",
  "whatToBring": ["Insurance card", "Medication list", "Photo ID"]
}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transcript: string | undefined = body?.transcript;
  const insurancePlan: string = body?.insurancePlan ?? DEFAULT_PLAN_KEY;

  if (!transcript) {
    return NextResponse.json(mockCarePathResult);
  }

  const plan =
    syntheticPricing.plans[insurancePlan] ?? syntheticPricing.plans[DEFAULT_PLAN_KEY];

  if (hasEmergencyIndicator(transcript)) {
    return NextResponse.json({
      ...mockCarePathResult,
      recommendedCareLevel: "emergency_room",
      confidence: "high",
      reasoning: [
        "Emergency indicators detected in transcript — immediate ER evaluation required.",
      ],
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(mockCarePathResult);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 1500,
      messages: [
        { role: "system", content: buildSystemPrompt(plan) },
        { role: "user", content: transcript },
      ],
    });

    const text = response.choices[0].message.content ?? "";
    const result: CarePathResult = JSON.parse(text);

    if (!result.recommendedCareLevel || !result.reasoning?.length) {
      throw new Error("Invalid CarePathResult shape");
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Classify error — returning mock result:", err);
    return NextResponse.json(mockCarePathResult);
  }
}
