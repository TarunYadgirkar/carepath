import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  CareLevel,
  CarePathResult,
  mockCarePathResult,
  mockDebriefResult,
  mockMedCardResult,
  mockSignalResult,
} from "@/types/carepath";
import { syntheticPricing, DEFAULT_PLAN_KEY, type InsurancePlan } from "@/data/synthetic-pricing";
import { hasEmergencyIndicator } from "@/lib/emergency-keywords";

type ClassifyMode = "triage" | "debrief" | "medcard" | "signal";

const VALID_MODES = new Set<ClassifyMode>(["triage", "debrief", "medcard", "signal"]);

const VALID_CARE_LEVELS = new Set<CareLevel>([
  "self_monitor",
  "telehealth",
  "primary_care",
  "urgent_care",
  "emergency_room",
]);

const MOCK_RESULTS: Record<ClassifyMode, unknown> = {
  triage: mockCarePathResult,
  debrief: mockDebriefResult,
  medcard: mockMedCardResult,
  signal: mockSignalResult,
};

const EMERGENCY_FALLBACK: Partial<CarePathResult> = {
  recommendedCareLevel: "emergency_room",
  confidence: "high",
  reasoning: [
    "Emergency indicators detected in transcript — immediate ER evaluation required.",
  ],
};

function buildSystemPrompt(plan: InsurancePlan): string {
  return `You are CarePath, a patient navigation assistant. You receive a transcript of a voice conversation where a patient described their symptoms, medications, and concerns.

Your job is to extract all relevant information and return a structured care navigation recommendation as JSON.

IMPORTANT RULES:
- You are NOT diagnosing. You are recommending a care LEVEL (where to go), not a condition.
- Your reasoning MUST be transparent and specific — cite what you heard (symptom, duration, severity), not generic advice.
- All cost estimates use the patient's synthetic insurance plan provided below.
- If ANY emergency red flag appears (chest pain, trouble breathing, loss of consciousness, uncontrolled bleeding, stroke signs, severe abdominal pain), set recommendedCareLevel to "emergency_room" immediately.

SYNTHETIC INSURANCE PLAN (use these exact values for cost estimates):
- Plan: ${plan.name}
- Deductible remaining: $${plan.deductibleRemaining}
- Telehealth copay: $${plan.telehealthCopay}
- PCP copay: $${plan.pcpCopay}
- Urgent care copay: $${plan.urgentCareCopay}
- ER copay: $${plan.erCopay}

CARE LEVELS (use exactly these strings) — use these criteria to differentiate:
- "self_monitor" — mild, stable or improving symptoms, no functional impact, no red flags (e.g. mild cold, minor ache that's already easing)
- "telehealth" — needs clinical input but no hands-on exam (e.g. medication question, mild rash, minor ongoing issue that can be assessed by video)
- "primary_care" — needs an in-person look but isn't urgent — can wait 1-2 days (e.g. symptoms persisting beyond a few days, follow-up on a chronic condition, non-severe but unresolved issue)
- "urgent_care" — needs same-day in-person care, not life-threatening (e.g. possible fracture/sprain, high fever, signs of infection, moderate pain that's worsening)
- "emergency_room" — any life-threatening indicator present (chest pain, trouble breathing, confusion, severe bleeding, loss of consciousness, stroke signs, severe abdominal pain)

When choosing between adjacent levels, weigh: symptom duration (longer/worsening pushes toward more urgent care), severity (functional impact pushes toward urgent_care or higher), and presence of any red flag (overrides everything to emergency_room).

Return a JSON object with exactly this structure:
{
  "patientSummary": "2-3 sentence summary of what the patient said",
  "recommendedCareLevel": "urgent_care",
  "confidence": "low | medium | high",
  "reasoning": ["cite the specific symptom, duration, and severity that drove this care level, and why it doesn't fit an adjacent level", "another specific reason"],
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
  "questionsToAsk": ["4-5 specific questions for the provider — include relevant tests/labs/imaging to ask about for these symptoms (e.g. 'Should I get a strep test?', 'Do I need an X-ray to rule out a fracture?', 'Should I get bloodwork to check for infection?'), not just generic questions"],
  "whatToSayAtCheckIn": "Script for what the patient says when they arrive",
  "whatToBring": ["Insurance card", "Medication list", "Photo ID"]
}`;
}

function buildDebriefPrompt(): string {
  return `You are CarePath, a post-visit patient companion. The patient just left a medical
appointment and is describing what their doctor told them. They may be confused, anxious,
or overwhelmed.

Your job:
1. Explain what they were told in plain, calm language
2. Extract the key facts: diagnosis or finding, recommended treatment or next step, follow-up timing
3. Generate specific questions they should ask at their follow-up
4. Flag anything that sounds like it needs urgent clarification or a second opinion
5. Produce a "what I learned today" summary card

Return JSON with this structure:
{
  "patientSummary": "what the patient described",
  "whatTheDoctorSaid": "plain language explanation of the diagnosis/findings",
  "keyFacts": ["fact 1", "fact 2"],
  "recommendedNextStep": "what to do next and by when",
  "followUpTiming": "when to go back",
  "questionsToAsk": ["question 1", "question 2", "question 3"],
  "flaggedConcerns": ["anything worth a second opinion or urgent clarification"],
  "medications": ["any new medications mentioned"],
  "allergies": ["any allergies mentioned"],
  "conditions": ["diagnosis or condition mentioned"],
  "whatToBring": ["what to bring to follow-up"],
  "redFlags": ["symptoms that would mean go back sooner"]
}`;
}

function buildMedCardPrompt(): string {
  return `You are CarePath, a medication assistant. The patient is telling you about their
medications, dosages, allergies, and conditions. Your job is to capture this accurately
and check for notable interactions.

Return JSON:
{
  "patientSummary": "brief summary",
  "medications": ["Lisinopril 10mg daily", "Metformin 500mg twice daily"],
  "allergies": ["Penicillin", "Sulfa drugs"],
  "conditions": ["Type 2 diabetes", "Hypertension"],
  "interactions": [
    {
      "drugs": ["Lisinopril", "Ibuprofen"],
      "severity": "moderate",
      "description": "NSAIDs like ibuprofen can reduce the effectiveness of ACE inhibitors and may increase risk of kidney problems"
    }
  ],
  "questionsToAsk": ["questions about their medications to raise with their doctor"]
}`;
}

function buildSignalPrompt(): string {
  return `You are CarePath Signal, a mental health check-in tool. The patient is describing
how they have been feeling recently. You are NOT a therapist and NOT providing mental
health treatment. Your role is to help the patient organize their thoughts before
a provider appointment.

Return JSON:
{
  "patientSummary": "what the patient shared",
  "themesNoticed": ["theme 1 — e.g. sleep disruption", "theme 2 — e.g. increased anxiety"],
  "whatToTellYourProvider": ["specific things worth mentioning at their appointment"],
  "questionsToAsk": ["questions to raise with their provider"],
  "positiveObservations": ["any positive or resilience signals noted"],
  "followUpSuggestion": "when to check in with a provider based on what was shared",
  "resources": ["if relevant — 988 Lifeline, Crisis Text Line, etc."],
  "disclaimer": "This check-in is not a clinical assessment. Please share this with your provider."
}`;
}

const MODE_PROMPT_BUILDERS: Record<Exclude<ClassifyMode, "triage">, () => string> = {
  debrief: buildDebriefPrompt,
  medcard: buildMedCardPrompt,
  signal: buildSignalPrompt,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transcript: unknown = body?.transcript;
  const insurancePlan: string = body?.insurancePlan ?? DEFAULT_PLAN_KEY;
  const rawMode: unknown = body?.mode ?? "triage";

  if (typeof transcript !== "string" || transcript.length > 16000) {
    return NextResponse.json(
      { error: "transcript must be a string of at most 16000 characters" },
      { status: 400 }
    );
  }

  if (!VALID_MODES.has(rawMode as ClassifyMode)) {
    return NextResponse.json(
      { error: "mode must be one of: triage, debrief, medcard, signal" },
      { status: 400 }
    );
  }

  const mode = rawMode as ClassifyMode;

  // Emergency override runs before the API key check so emergencies always escalate.
  if (mode === "triage" && hasEmergencyIndicator(transcript)) {
    return NextResponse.json({ ...mockCarePathResult, ...EMERGENCY_FALLBACK });
  }

  if (mode !== "triage") {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(MOCK_RESULTS[mode]);
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 1500,
        messages: [
          { role: "system", content: MODE_PROMPT_BUILDERS[mode]() },
          { role: "user", content: transcript },
        ],
      });

      const text = response.choices[0].message.content ?? "";
      const result: unknown = JSON.parse(text);

      if (
        typeof result !== "object" ||
        result === null ||
        !("patientSummary" in result)
      ) {
        throw new Error("Invalid non-triage result shape");
      }

      return NextResponse.json(result);
    } catch (err) {
      console.error(
        "Classify error — returning mock result:",
        err instanceof Error ? err.message : "unknown"
      );
      return NextResponse.json(MOCK_RESULTS[mode]);
    }
  }

  const plan =
    syntheticPricing.plans[insurancePlan] ?? syntheticPricing.plans[DEFAULT_PLAN_KEY];

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(mockCarePathResult);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 });
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

    if (
      !result.recommendedCareLevel ||
      !VALID_CARE_LEVELS.has(result.recommendedCareLevel) ||
      !result.reasoning?.length
    ) {
      throw new Error("Invalid CarePathResult shape");
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error(
      "Classify error — returning mock result:",
      err instanceof Error ? err.message : "unknown"
    );
    if (hasEmergencyIndicator(transcript)) {
      return NextResponse.json({ ...mockCarePathResult, ...EMERGENCY_FALLBACK });
    }
    return NextResponse.json(mockCarePathResult);
  }
}
