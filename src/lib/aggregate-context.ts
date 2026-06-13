import { getSymptomLog, buildSymptomLogContext } from "@/lib/symptom-log";
import { getMedCard, buildMedCardContext } from "@/lib/medcard";
import { getEpicImport, buildEpicContext } from "@/lib/epic-import";

export interface AggregateTranscript {
  transcript: string;
  hasAnyData: boolean;
}

export function buildAggregateTranscript(): AggregateTranscript {
  if (typeof window === "undefined") {
    return { transcript: "", hasAnyData: false };
  }

  const symptomLog = getSymptomLog();
  const medCard = getMedCard();
  const epicImport = getEpicImport();

  const symptomContext = buildSymptomLogContext(symptomLog).trim();
  const medContext = buildMedCardContext(medCard).trim();
  const epicContext = buildEpicContext(epicImport).trim();

  const segments = [symptomContext, medContext, epicContext].filter(Boolean);
  const hasAnyData = segments.length > 0;

  if (!hasAnyData) {
    return { transcript: "", hasAnyData: false };
  }

  const lines = [
    "Patient: I haven't described my symptoms out loud, but here is everything I already have on file. Please use it to recommend where I should go for care.",
    ...segments.map((segment) => `Patient: ${segment}`),
  ];

  return { transcript: lines.join("\n\n"), hasAnyData: true };
}
