import type { SignalResult } from "@/types/carepath";
import { ListSection } from "@/components/care-card/ListSection";

export function SignalCardView({ result }: { result: SignalResult }) {
  return (
    <div className="flex flex-col gap-4">
      {/* What you shared */}
      <section
        className="animate-fade-up rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          What you shared
        </h2>
        <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {result.patientSummary}
        </p>
      </section>

      <div className="animate-fade-up stagger-1">
        <ListSection title="Patterns in what you shared" items={result.themesNoticed} />
      </div>
      <div className="animate-fade-up stagger-2">
        <ListSection title="What to tell your provider" items={result.whatToTellYourProvider} />
      </div>
      <div className="animate-fade-up stagger-2">
        <ListSection title="What's going well" items={result.positiveObservations} />
      </div>
      <div className="animate-fade-up stagger-3">
        <ListSection title="Questions to ask your provider" items={result.questionsToAsk} />
      </div>

      {/* Follow-up */}
      <section
        className="animate-fade-up stagger-3 rounded-[var(--radius-xl)] p-6"
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
          Follow-up suggestion
        </h2>
        <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {result.followUpSuggestion}
        </p>
      </section>

      {result.resources.length > 0 && (
        <div className="animate-fade-up stagger-4">
          <ListSection title="Resources" items={result.resources} />
        </div>
      )}

      {/* Disclaimer — always visible */}
      <div
        className="animate-fade-up stagger-5 rounded-[var(--radius-xl)] p-4 text-center"
        style={{
          background: "var(--care-urgent-bg)",
          border: "1px solid var(--care-urgent-border)",
        }}
      >
        <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--care-urgent-text)" }}>
          {result.disclaimer}
        </p>
      </div>
    </div>
  );
}
