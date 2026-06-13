import type { DebriefResult } from "@/types/carepath";
import { ListSection } from "@/components/care-card/ListSection";
import { MedCard } from "@/components/care-card/MedCard";

export function DebriefCardView({ result }: { result: DebriefResult }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Patient context */}
      <section
        className="animate-fade-up rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--text-subtle)" }}>
          Your visit summary
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {result.patientSummary}
        </p>
      </section>

      {/* What came out of the visit — plain-language, not over-authoritative */}
      <section
        className="animate-fade-up stagger-1 rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          What came up at your visit
        </h2>
        <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {result.whatTheDoctorSaid}
        </p>
        <p
          className="mt-3 text-xs leading-relaxed"
          style={{ color: "var(--text-subtle)" }}
        >
          This is an AI-assisted summary of what you described — not a direct quote from your provider.
          Verify details with your care team.
        </p>
      </section>

      <div className="animate-fade-up stagger-2">
        <ListSection title="Key facts from this visit" items={result.keyFacts} />
      </div>

      {/* Recommended next step */}
      <section
        className="animate-fade-up stagger-2 rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Recommended next step
        </h2>
        <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {result.recommendedNextStep}
        </p>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          Follow-up: {result.followUpTiming}
        </p>
      </section>

      <div className="animate-fade-up stagger-3">
        <ListSection
          title="Items flagged for clarification or second opinion"
          items={result.flaggedConcerns}
          variant="warning"
        />
      </div>

      <div className="animate-fade-up stagger-3">
        <MedCard medications={result.medications} allergies={result.allergies} conditions={result.conditions} />
      </div>

      <div className="animate-fade-up stagger-4">
        <ListSection title="Questions to ask at your follow-up" items={result.questionsToAsk} />
      </div>
      <div className="animate-fade-up stagger-4">
        <ListSection title="What to bring" items={result.whatToBring} />
      </div>
      <div className="animate-fade-up stagger-5">
        <ListSection title="Go back sooner if" items={result.redFlags} variant="warning" />
      </div>
    </div>
  );
}
