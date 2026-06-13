// Static simulation of an Epic FHIR R4 patient record (SMART on FHIR).
// No real OAuth or network calls — architecturally correct shape, ready to be
// swapped for a real FHIR client when app registration is in place.

export interface EpicSystem {
  id: string;
  name: string;
  logo: string;
  fhirBase: string;
}

export const EPIC_SYSTEMS: EpicSystem[] = [
  { id: "sutter", name: "Sutter Health", logo: "🏥", fhirBase: "https://epicproxy.sutterhealth.org/FHIRproxy/api/FHIR/R4" },
  { id: "kaiser", name: "Kaiser Permanente", logo: "🏥", fhirBase: "https://healthy.kaiserpermanente.org/smart-fhir/api/FHIR/R4" },
  { id: "ucsf", name: "UCSF Health", logo: "🏥", fhirBase: "https://epicproxy.ucsf.edu/fhir-prd/api/FHIR/R4" },
];

export const EPIC_FHIR_MOCK = {
  patient: {
    name: "Maya Patel",
    dob: "1988-04-15",
    mrn: "E2847163",
    facility: "Sutter Health Palo Alto Medical Foundation",
    primaryProvider: "Dr. Sarah Chen, MD — Internal Medicine",
  },
  medications: [
    { name: "Lisinopril 10 MG Oral Tablet", frequency: "1 tablet once daily", prescriber: "Dr. Sarah Chen", started: "2023-02" },
    { name: "Metformin HCl 500 MG Oral Tablet", frequency: "1 tablet twice daily with meals", prescriber: "Dr. Sarah Chen", started: "2024-07" },
  ],
  allergies: [
    { substance: "Penicillin", reaction: "Urticaria (hives)", severity: "Moderate", recorded: "2019-08" },
  ],
  conditions: [
    { name: "Essential hypertension", icd10: "I10", status: "Active", diagnosed: "2023-01" },
    { name: "Prediabetes", icd10: "R73.09", status: "Active", diagnosed: "2024-06" },
  ],
  recentEncounters: [
    { date: "2026-05-15", type: "Office visit — Annual physical", provider: "Dr. Sarah Chen", facility: "Sutter Palo Alto" },
    { date: "2026-02-03", type: "Urgent care visit — Upper respiratory infection", provider: "NP Anita Torres", facility: "Sutter Express Care" },
  ],
  labResults: [
    { name: "Hemoglobin A1c (HbA1c)", value: "6.1%", date: "2026-05-15", reference: "Normal < 5.7% | Prediabetes 5.7–6.4% | Diabetes ≥ 6.5%", flag: "HIGH_NORMAL" },
    { name: "eGFR (kidney function)", value: "87 mL/min/1.73m²", date: "2026-05-15", reference: "Normal ≥ 60", flag: "NORMAL" },
    { name: "Blood Pressure", value: "128/82 mmHg", date: "2026-05-15", reference: "Optimal < 120/80", flag: "ELEVATED" },
    { name: "LDL Cholesterol", value: "118 mg/dL", date: "2026-05-15", reference: "Optimal < 100 mg/dL", flag: "BORDERLINE" },
    { name: "Serum Creatinine", value: "0.9 mg/dL", date: "2026-05-15", reference: "Normal 0.6–1.1", flag: "NORMAL" },
  ],
};

export type EpicImportResult = typeof EPIC_FHIR_MOCK;

export type LabFlag = "NORMAL" | "HIGH_NORMAL" | "ELEVATED" | "BORDERLINE" | "HIGH" | "LOW";

export const LAB_FLAG_STYLES: Record<string, string> = {
  NORMAL: "bg-emerald-100 text-emerald-900",
  HIGH_NORMAL: "bg-amber-100 text-amber-900",
  ELEVATED: "bg-amber-100 text-amber-900",
  BORDERLINE: "bg-amber-100 text-amber-900",
  HIGH: "bg-red-100 text-red-900",
  LOW: "bg-red-100 text-red-900",
};
