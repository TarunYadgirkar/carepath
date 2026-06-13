import { sanitizeField } from "@/lib/medcard";

export interface SymptomEntry {
  id: string;
  date: string;
  time?: string;
  label: string;
  severity?: number;
  notes?: string;
  createdAt: string;
}

export interface SymptomLog {
  entries: SymptomEntry[];
}

const SYMPTOM_LOG_KEY = "carepath-symptom-log";
const NOTES_MAX_LEN = 400;

function sanitizeNotes(value: string): string {
  return value
    .replace(/[\r\n\t\x00-\x1F\x7F]/g, " ")
    .replace(/\b(system|user|assistant|ignore\s+previous)\s*:/gi, (m) => m.replace(":", "​:"))
    .trim()
    .slice(0, NOTES_MAX_LEN);
}

export function getSymptomLog(): SymptomLog {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const stored = localStorage.getItem(SYMPTOM_LOG_KEY);
    return stored ? (JSON.parse(stored) as SymptomLog) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

export function addSymptomEntry(
  entry: Omit<SymptomEntry, "id" | "createdAt">
): SymptomEntry {
  const newEntry: SymptomEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return newEntry;
  const log = getSymptomLog();
  const updated: SymptomLog = { entries: [...log.entries, newEntry] };
  localStorage.setItem(SYMPTOM_LOG_KEY, JSON.stringify(updated));
  return newEntry;
}

export function removeSymptomEntry(id: string): void {
  if (typeof window === "undefined") return;
  const log = getSymptomLog();
  const updated: SymptomLog = {
    entries: log.entries.filter((e) => e.id !== id),
  };
  localStorage.setItem(SYMPTOM_LOG_KEY, JSON.stringify(updated));
}

export function clearSymptomLog(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SYMPTOM_LOG_KEY);
}

export function buildSymptomLogContext(log: SymptomLog): string {
  if (log.entries.length === 0) return "";

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recent = log.entries
    .filter((e) => e.date >= cutoffStr)
    .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  if (recent.length === 0) return "";

  const summaries = recent.map((e) => {
    const label = sanitizeField(e.label);
    const dateParts = e.date.split("-");
    const shortDate =
      dateParts.length === 3
        ? `${parseInt(dateParts[1])}/${parseInt(dateParts[2])}`
        : e.date;
    const timePart = e.time ? ` ${sanitizeField(e.time)}` : "";
    const severityPart =
      e.severity !== undefined ? ` (${e.severity}/10)` : "";
    const notesPart = e.notes ? ` — ${sanitizeNotes(e.notes)}` : "";
    return `${shortDate}${timePart} ${label}${severityPart}${notesPart}`;
  });

  return `\n\nPatient's recent symptom log (last 14 days): ${summaries.join("; ")}. Use this context — they don't need to repeat themselves.`;
}
