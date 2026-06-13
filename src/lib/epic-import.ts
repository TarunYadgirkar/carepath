import { EPIC_FHIR_MOCK, type EpicImportResult } from "@/data/epic-mock";
import { sanitizeField } from "@/lib/medcard";

export interface EpicImportState {
  connected: boolean;
  systemId: string;
  systemName: string;
  importedAt: string;
  record: EpicImportResult;
}

const EPIC_IMPORT_KEY = "carepath-epic-import";

export function getEpicImport(): EpicImportState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(EPIC_IMPORT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveEpicImport(systemId: string, systemName: string): EpicImportState {
  const state: EpicImportState = {
    connected: true,
    systemId,
    systemName,
    importedAt: new Date().toISOString(),
    record: EPIC_FHIR_MOCK,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(EPIC_IMPORT_KEY, JSON.stringify(state));
  }
  return state;
}

export function clearEpicImport(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EPIC_IMPORT_KEY);
}

export function buildEpicContext(state: EpicImportState | null): string {
  if (!state) return "";
  const { record } = state;
  const systemName = sanitizeField(state.systemName);
  const meds = record.medications
    .map((m) => `${sanitizeField(m.name)} (${sanitizeField(m.frequency)})`)
    .join(", ");
  const allergies = record.allergies
    .map((a) => `${sanitizeField(a.substance)} (${sanitizeField(a.reaction)}, ${sanitizeField(a.severity)})`)
    .join(", ");
  const conditions = record.conditions
    .map((c) => `${sanitizeField(c.name)} (${sanitizeField(c.status)})`)
    .join(", ");
  const labs = record.labResults
    .map((l) => `${sanitizeField(l.name)}: ${sanitizeField(l.value)} (${sanitizeField(l.flag)})`)
    .join(", ");
  return `\n\nThe patient connected their health records from ${systemName}. On file: Medications: ${meds}. Allergies: ${allergies}. Conditions: ${conditions}. Recent labs: ${labs}. Use this context — they don't need to repeat themselves.`;
}
