export interface MedCardData {
  medications: string[];
  allergies: string[];
  conditions: string[];
  lastUpdated: string;
}

const MEDCARD_KEY = "carepath-medcard";

export function getMedCard(): MedCardData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(MEDCARD_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveMedCard(data: Omit<MedCardData, "lastUpdated">): void {
  if (typeof window === "undefined") return;
  const existing = getMedCard();
  localStorage.setItem(
    MEDCARD_KEY,
    JSON.stringify({
      medications: dedupe([...(existing?.medications ?? []), ...data.medications]),
      allergies: dedupe([...(existing?.allergies ?? []), ...data.allergies]),
      conditions: dedupe([...(existing?.conditions ?? []), ...data.conditions]),
      lastUpdated: new Date().toISOString(),
    })
  );
}

export function clearMedCard(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MEDCARD_KEY);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function buildMedCardContext(data: MedCardData | null): string {
  if (!data || (data.medications.length === 0 && data.allergies.length === 0 && data.conditions.length === 0)) {
    return "";
  }
  const parts: string[] = [];
  if (data.medications.length > 0) parts.push(`Medications: ${data.medications.join(", ")}.`);
  if (data.allergies.length > 0) parts.push(`Known allergies: ${data.allergies.join(", ")}.`);
  if (data.conditions.length > 0) parts.push(`Known conditions: ${data.conditions.join(", ")}.`);
  return `\n\nThe patient has the following on file: ${parts.join(" ")} Use this context — they don't need to repeat themselves.`;
}
