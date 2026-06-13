import type { CarePathResult } from "@/types/carepath";
import { CareLevelHeader } from "./CareLevelHeader";
import { ListSection } from "./ListSection";
import { RiskSignalTags } from "./RiskSignalTags";
import { CareOptionsTable } from "./CareOptionsTable";
import { MedCard } from "./MedCard";
import { CheckInScript } from "./CheckInScript";
import { CommunitySuggestions } from "./CommunitySuggestions";

export function CareCardView({ result }: { result: CarePathResult }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {/* 1 — Hero: care level + confidence (3-second rule: must dominate) */}
      <div className="animate-fade-up stagger-1">
        <CareLevelHeader
          careLevel={result.recommendedCareLevel}
          confidence={result.confidence}
          patientSummary={result.patientSummary}
        />
      </div>

      {/* 2 — AI reasoning: visible, not hidden behind a toggle */}
      <div className="animate-fade-up stagger-2">
        <ListSection title="Why this recommendation" items={result.reasoning} />
      </div>

      {/* 3 — Risk signals: prominent, scannable tags */}
      <div className="animate-fade-up stagger-3">
        <RiskSignalTags signals={result.riskSignals} />
      </div>

      {/* 4 — Care options table with cost estimates */}
      <div className="animate-fade-up stagger-4">
        <CareOptionsTable
          options={result.careOptions}
          recommendedCareLevel={result.recommendedCareLevel}
          insurancePlan={result.insurancePlan}
          deductibleRemaining={result.deductibleRemaining}
        />
      </div>

      {/* 5 — Red flags: prominent warning section */}
      <div className="animate-fade-up stagger-5">
        <ListSection
          title="Red flags — seek immediate care if these occur"
          items={result.redFlags}
          variant="warning"
        />
      </div>

      {/* 6 — Medical card */}
      <div className="animate-fade-up" style={{ animationDelay: "360ms" }}>
        <MedCard
          medications={result.medications}
          allergies={result.allergies}
          conditions={result.conditions}
        />
      </div>

      {/* 7 — Check-in script */}
      <div className="animate-fade-up" style={{ animationDelay: "420ms" }}>
        <CheckInScript script={result.whatToSayAtCheckIn} />
      </div>

      {/* 8 — Questions to ask */}
      <div className="animate-fade-up" style={{ animationDelay: "480ms" }}>
        <ListSection title="Questions to ask your provider" items={result.questionsToAsk} />
      </div>

      {/* 9 — What to bring */}
      <div className="animate-fade-up" style={{ animationDelay: "540ms" }}>
        <ListSection title="What to bring" items={result.whatToBring} />
      </div>

      {/* 10 — Peer-support communities (opt-in) */}
      <div className="animate-fade-up" style={{ animationDelay: "600ms" }}>
        <CommunitySuggestions
          summary={result.patientSummary}
          signals={result.riskSignals}
        />
      </div>
    </div>
  );
}
