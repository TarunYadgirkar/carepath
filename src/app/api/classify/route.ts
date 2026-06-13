import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  CarePathResult,
  mockCarePathResult,
  mockDebriefResult,
  mockMedCardResult,
  mockSignalResult,
} from "@/types/carepath";
import { syntheticPricing, DEFAULT_PLAN_KEY, type InsurancePlan } from "@/data/synthetic-pricing";

type ClassifyMode = "triage" | "debrief" | "medcard" | "signal";

const MOCK_RESULTS: Record<ClassifyMode, unknown> = {
  triage: mockCarePathResult,
  debrief: mockDebriefResult,
  medcard: mockMedCardResult,
  signal: mockSignalResult,
};

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
  const transcript: string | undefined = body?.transcript;
  const insurancePlan: string = body?.insurancePlan ?? DEFAULT_PLAN_KEY;
  const mode: ClassifyMode = body?.mode ?? "triage";

  if (!transcript) {
    return NextResponse.json(MOCK_RESULTS[mode]);
  }

  if (mode !== "triage") {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(MOCK_RESULTS[mode]);
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: 1500,
        messages: [
          { role: "system", content: MODE_PROMPT_BUILDERS[mode]() },
          { role: "user", content: transcript },
        ],
      });

      const text = response.choices[0].message.content ?? "";
      const result = JSON.parse(text);
      return NextResponse.json(result);
    } catch (err) {
      console.error("Classify error — returning mock result:", err);
      return NextResponse.json(MOCK_RESULTS[mode]);
    }
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
