// src/types/carepath.ts
// FROZEN — this is the contract all components build against.
// Do not modify without updating PROGRESS.md and notifying any parallel sessions.

export type CareLevel =
  | "self_monitor"
  | "telehealth"
  | "primary_care"
  | "urgent_care"
  | "emergency_room";

export type Confidence = "low" | "medium" | "high";

export interface CareOption {
  type: CareLevel;
  label: string;
  medicalFit: "low" | "medium" | "high";
  waitTime: string;
  estimatedCost: string;
  explanation: string;
}

export interface CarePathResult {
  // Patient summary
  patientSummary: string;

  // Triage output
  recommendedCareLevel: CareLevel;
  confidence: Confidence;
  reasoning: string[];           // Array of reasoning points — MUST render on screen

  // Risk signals
  riskSignals: string[];         // What the AI noticed (e.g. "Fever lasting 3 days")
  redFlags: string[];            // What would trigger escalation (e.g. "Trouble breathing")

  // Medication / allergy capture
  medications: string[];
  allergies: string[];
  conditions: string[];

  // Cost-aware care options
  insurancePlan: string;
  deductibleRemaining: number;
  careOptions: CareOption[];

  // Provider preparation
  questionsToAsk: string[];
  whatToSayAtCheckIn: string;
  whatToBring: string[];
}

// --- Mock fixtures for fallback demo mode ---

export const mockCarePathResult: CarePathResult = {
  patientSummary:
    "Patient reports fever for 3 days, severe sore throat, and difficulty swallowing. Currently taking lisinopril 10mg and took ibuprofen today. No trouble breathing or chest pain. Can drink water, but swallowing is painful. Synthetic BlueShield Silver PPO plan with approximately $420 deductible remaining.",

  recommendedCareLevel: "urgent_care",
  confidence: "medium",
  reasoning: [
    "Fever lasting 3 days without improvement warrants same-day evaluation.",
    "Difficulty swallowing alongside sore throat may indicate strep or another infection requiring a throat swab.",
    "No chest pain or trouble breathing — ER-level urgency criteria not met.",
    "Ibuprofen use today noted — provider should be informed to avoid contraindications.",
  ],

  riskSignals: [
    "Fever lasting 3 days",
    "Severe sore throat",
    "Difficulty swallowing",
    "Current medication: lisinopril 10mg",
    "Ibuprofen taken today",
  ],
  redFlags: [
    "Develop trouble breathing or shortness of breath",
    "Experience chest pain or tightness",
    "Show signs of severe dehydration (unable to drink, dark urine, dizziness)",
    "Develop high fever above 104°F / 40°C",
    "Notice rash, especially if spreading rapidly",
  ],

  medications: ["Lisinopril 10mg", "Ibuprofen (taken today)"],
  allergies: ["None reported"],
  conditions: [],

  insurancePlan: "BlueShield Silver PPO (synthetic)",
  deductibleRemaining: 420,
  careOptions: [
    {
      type: "telehealth",
      label: "Telehealth",
      medicalFit: "low",
      waitTime: "~20 minutes",
      estimatedCost: "$20",
      explanation:
        "Telehealth may not be appropriate — a physical throat exam and possible swab are likely needed.",
    },
    {
      type: "primary_care",
      label: "Primary Care",
      medicalFit: "medium",
      waitTime: "1–2 days",
      estimatedCost: "$35",
      explanation:
        "Appropriate if symptoms are not worsening, but 3-day fever duration suggests same-day care is preferable.",
    },
    {
      type: "urgent_care",
      label: "Urgent Care",
      medicalFit: "high",
      waitTime: "~45 minutes",
      estimatedCost: "$85–$140",
      explanation:
        "Best fit. Can perform throat swab, strep test, and prescribe antibiotics if needed. Same-day availability.",
    },
    {
      type: "emergency_room",
      label: "Emergency Room",
      medicalFit: "low",
      waitTime: "2–4 hours",
      estimatedCost: "$650–$1,200",
      explanation:
        "Only appropriate if red flags appear — trouble breathing, severe dehydration, or rapidly worsening symptoms.",
    },
  ],

  questionsToAsk: [
    "Could this be strep throat or another bacterial infection?",
    "Do I need a throat swab or rapid strep test?",
    "Are there any medication interactions between lisinopril and antibiotics you might prescribe?",
    "Should I stop taking ibuprofen before treatment?",
    "What symptoms should make me go to the ER instead?",
  ],
  whatToSayAtCheckIn:
    "I've had a fever for three days, a severe sore throat, and difficulty swallowing. I take lisinopril 10mg daily and took ibuprofen today. No trouble breathing or chest pain.",
  whatToBring: [
    "List of current medications (lisinopril 10mg, ibuprofen today)",
    "Insurance card",
    "Photo ID",
    "This CarePath summary (share or screenshot)",
  ],
};
