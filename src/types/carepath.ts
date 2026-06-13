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

// --- Debrief mode (post-visit) ---

export interface DebriefResult {
  patientSummary: string;
  whatTheDoctorSaid: string;
  keyFacts: string[];
  recommendedNextStep: string;
  followUpTiming: string;
  questionsToAsk: string[];
  flaggedConcerns: string[];
  medications: string[];
  allergies: string[];
  conditions: string[];
  whatToBring: string[];
  redFlags: string[];
}

export const mockDebriefResult: DebriefResult = {
  patientSummary:
    "Patient described a recent appointment where their doctor reviewed lab results and discussed next steps for blood pressure management.",
  whatTheDoctorSaid:
    "Your blood pressure is a bit higher than your doctor would like, and your recent labs show your A1c is in the prediabetic range. Your doctor wants to try a low-dose medication and recheck things in a few months — this is common and very manageable.",
  keyFacts: [
    "Blood pressure reading was elevated (128/82)",
    "A1c of 6.1% — prediabetic range, not diabetes",
    "Doctor is starting a low-dose blood pressure medication",
  ],
  recommendedNextStep: "Start the new medication as prescribed and monitor blood pressure at home twice a week.",
  followUpTiming: "Follow-up appointment in 3 months to recheck blood pressure and labs.",
  questionsToAsk: [
    "What time of day should I take this medication?",
    "Are there foods or other medications I should avoid while on it?",
    "What blood pressure readings at home should prompt me to call sooner?",
    "Should I make any diet or exercise changes before the next visit?",
  ],
  flaggedConcerns: [],
  medications: ["New blood pressure medication (low-dose, name not specified)"],
  allergies: [],
  conditions: ["Elevated blood pressure", "Prediabetes (A1c 6.1%)"],
  whatToBring: ["Home blood pressure log", "List of current medications", "Insurance card"],
  redFlags: [
    "Severe headache, vision changes, or chest pain — seek immediate care",
    "Blood pressure readings consistently above 180/120",
  ],
};

// --- MedCard mode (medication capture + interaction check) ---

export interface DrugInteraction {
  drugs: string[];
  severity: "low" | "moderate" | "high";
  description: string;
}

export interface MedCardResult {
  patientSummary: string;
  medications: string[];
  allergies: string[];
  conditions: string[];
  interactions: DrugInteraction[];
  questionsToAsk: string[];
}

export const mockMedCardResult: MedCardResult = {
  patientSummary:
    "Patient is taking lisinopril for blood pressure and metformin for prediabetes, took ibuprofen today, and has a penicillin allergy.",
  medications: ["Lisinopril 10mg daily", "Metformin 500mg twice daily", "Ibuprofen (as needed)"],
  allergies: ["Penicillin"],
  conditions: ["Hypertension", "Prediabetes"],
  interactions: [
    {
      drugs: ["Lisinopril", "Ibuprofen"],
      severity: "moderate",
      description:
        "NSAIDs like ibuprofen can reduce the effectiveness of ACE inhibitors (lisinopril) and may increase the risk of kidney problems with regular use.",
    },
  ],
  questionsToAsk: [
    "Is it safe to keep taking ibuprofen occasionally with lisinopril?",
    "Are there pain relievers that are safer for me long-term?",
    "Should my kidney function be monitored given this combination?",
  ],
};

// --- Signal mode (mental health check-in) ---

export interface SignalResult {
  patientSummary: string;
  themesNoticed: string[];
  whatToTellYourProvider: string[];
  questionsToAsk: string[];
  positiveObservations: string[];
  followUpSuggestion: string;
  resources: string[];
  disclaimer: string;
}

export const mockSignalResult: SignalResult = {
  patientSummary:
    "Patient shared that sleep has been disrupted for the past couple of weeks and they've been feeling more anxious than usual, especially in the mornings.",
  themesNoticed: [
    "Sleep disruption — difficulty falling asleep most nights",
    "Increased anxiety, particularly in the morning",
  ],
  whatToTellYourProvider: [
    "Sleep has been disrupted for about two weeks",
    "Morning anxiety has been more noticeable recently",
    "No changes in appetite or energy reported",
  ],
  questionsToAsk: [
    "Could this be related to stress, or is it worth ruling out other causes?",
    "Are there sleep hygiene changes worth trying first?",
    "Would a short-term referral to a counselor be helpful?",
  ],
  positiveObservations: ["Patient is proactively reflecting on their wellbeing and reaching out"],
  followUpSuggestion: "Worth mentioning at your next regular appointment, or sooner if it worsens.",
  resources: ["988 Suicide & Crisis Lifeline (call or text 988)", "Crisis Text Line (text HOME to 741741)"],
  disclaimer: "This check-in is not a clinical assessment. Please share this with your provider.",
};
