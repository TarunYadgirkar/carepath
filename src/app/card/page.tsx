"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CarePathResult } from "@/types/carepath";
import { loadCareResult } from "@/lib/care-result-storage";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { CareLevelHeader } from "@/components/care-card/CareLevelHeader";
import { ListSection } from "@/components/care-card/ListSection";
import { RiskSignalTags } from "@/components/care-card/RiskSignalTags";
import { CareOptionsTable } from "@/components/care-card/CareOptionsTable";
import { MedCard } from "@/components/care-card/MedCard";
import { CheckInScript } from "@/components/care-card/CheckInScript";

export default function CarePage() {
  const [result, setResult] = useState<CarePathResult | null | undefined>(undefined);

  useEffect(() => {
    setResult(loadCareResult());
  }, []);

  if (result === undefined) {
    return null;
  }

  if (result === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">No Care Card yet</h1>
        <p className="text-sm text-zinc-500">Start an intake conversation to generate one.</p>
        <Link
          href="/intake"
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
        >
          Go to Intake
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <CareLevelHeader
        careLevel={result.recommendedCareLevel}
        confidence={result.confidence}
        patientSummary={result.patientSummary}
      />

      <ListSection title="Reasoning" items={result.reasoning} />
      <RiskSignalTags signals={result.riskSignals} />
      <CareOptionsTable
        options={result.careOptions}
        recommendedCareLevel={result.recommendedCareLevel}
      />
      <ListSection title="Red flags — seek immediate care if these occur" items={result.redFlags} variant="warning" />
      <MedCard
        medications={result.medications}
        allergies={result.allergies}
        conditions={result.conditions}
      />
      <CheckInScript script={result.whatToSayAtCheckIn} />
      <ListSection title="Questions to ask" items={result.questionsToAsk} />
      <ListSection title="What to bring" items={result.whatToBring} />

      <div className="flex justify-center py-4">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
