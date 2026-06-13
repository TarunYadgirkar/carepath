import type { CarePathResult } from "@/types/carepath";
import { CareLevelHeader } from "./CareLevelHeader";
import { ListSection } from "./ListSection";
import { RiskSignalTags } from "./RiskSignalTags";
import { CareOptionsTable } from "./CareOptionsTable";
import { MedCard } from "./MedCard";
import { CheckInScript } from "./CheckInScript";

export function CareCardView({ result }: { result: CarePathResult }) {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
