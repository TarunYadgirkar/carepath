import type { MedCardResult } from "@/types/carepath";
import { ListSection } from "@/components/care-card/ListSection";
import { MedCard } from "@/components/care-card/MedCard";

const SEVERITY_META: Record<
  string,
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  low: {
    bg: "var(--care-self-bg)",
    text: "var(--care-self-text)",
    border: "var(--care-self-border)",
    icon: "●",
    label: "Low severity",
  },
  moderate: {
    bg: "var(--care-urgent-bg)",
    text: "var(--care-urgent-text)",
    border: "var(--care-urgent-border)",
    icon: "▲",
    label: "Moderate severity",
  },
  high: {
    bg: "var(--care-er-bg)",
    text: "var(--care-er-text)",
    border: "var(--care-er-border)",
    icon: "⚠",
    label: "High severity — verify with pharmacist",
  },
};

export function MedCardResultView({ result }: { result: MedCardResult }) {
  return (
    <div id="medcard-export" className="flex flex-col gap-4" style={{ background: "var(--background)", padding: "4px" }}>

      {/* Patient summary */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xs)",
        }}
        className="p-6"
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Patient Summary
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {result.patientSummary}
        </p>
      </section>

      {/* MedCard (medications / allergies / conditions) */}
      <MedCard
        medications={result.medications}
        allergies={result.allergies}
        conditions={result.conditions}
      />

      {/* Drug interactions */}
      {result.interactions.length > 0 && (
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-xs)",
          }}
          className="p-6"
        >
          <h2
            className="text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-subtle)" }}
          >
            Drug Interactions
          </h2>

          {/* Caveat — always visible */}
          <div
            className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
            style={{
              background: "var(--care-urgent-bg)",
              color: "var(--care-urgent-text)",
              border: "1px solid var(--care-urgent-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            >
              <path
                d="M7 1L13 12H1L7 1Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.75" fill="currentColor" />
            </svg>
            <span>
              <strong className="font-semibold">AI estimate</strong> — not a substitute for a
              pharmacist or prescriber. Verify before changing any medication.
            </span>
          </div>

          <ul className="mt-4 flex flex-col gap-4">
            {result.interactions.map((interaction) => {
              const meta = SEVERITY_META[interaction.severity] ?? SEVERITY_META.low;
              return (
                <li
                  key={interaction.drugs.join("+")}
                  className="flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {interaction.drugs.join(" + ")}
                    </span>
                    {/* Severity badge — icon + text, never color alone */}
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        background: meta.bg,
                        color: meta.text,
                        border: `1px solid ${meta.border}`,
                      }}
                      aria-label={meta.label}
                    >
                      <span aria-hidden="true">{meta.icon}</span>
                      {interaction.severity}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {interaction.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Questions to ask doctor */}
      <ListSection title="Questions to ask your doctor" items={result.questionsToAsk} />
    </div>
  );
}
