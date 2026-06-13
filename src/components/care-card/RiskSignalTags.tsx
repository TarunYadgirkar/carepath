type Props = {
  signals: string[];
};

export function RiskSignalTags({ signals }: Props) {
  if (signals.length === 0) return null;

  return (
    <section
      aria-labelledby="risk-signals-heading"
      className="rounded-[var(--radius-xl)] ring-1"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--care-urgent-ring)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2
            id="risk-signals-heading"
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-subtle)" }}
          >
            Risk signals noted
          </h2>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Risk signals">
          {signals.map((signal) => (
            <span
              key={signal}
              role="listitem"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-xs font-medium ring-1"
              style={{
                background: "var(--care-urgent-bg)",
                color: "var(--care-urgent-text)",
                borderColor: "var(--care-urgent-border)",
              }}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--care-urgent-ring)" }}
              />
              {signal}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
