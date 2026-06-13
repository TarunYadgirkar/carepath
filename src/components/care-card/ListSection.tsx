type Variant = "default" | "warning";

type Props = {
  title: string;
  items: string[];
  variant?: Variant;
};

export function ListSection({ title, items, variant = "default" }: Props) {
  if (items.length === 0) return null;

  const isWarning = variant === "warning";

  const sectionId = `list-section-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section
      aria-labelledby={sectionId}
      className="rounded-[var(--radius-xl)] ring-1"
      style={{
        background: isWarning ? "var(--care-er-bg)" : "var(--surface)",
        borderColor: isWarning ? "var(--care-er-border)" : "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Warning header strip */}
      {isWarning && (
        <div
          className="flex items-center gap-2 rounded-t-[var(--radius-xl)] px-5 pt-4 pb-0"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--care-er-text)" }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2
            id={sectionId}
            className="text-xs font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--care-er-text)" }}
          >
            Red flags
          </h2>
        </div>
      )}

      <div className="p-5">
        {!isWarning && (
          <h2
            id={sectionId}
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-subtle)" }}
          >
            {title}
          </h2>
        )}

        {isWarning && (
          <p
            className="mt-1 text-sm font-medium"
            style={{ color: "var(--care-er-text)" }}
          >
            Seek immediate care if any of these occur:
          </p>
        )}

        <ul
          className="mt-3 space-y-[10px]"
          role="list"
        >
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm leading-relaxed"
              style={{ color: isWarning ? "var(--care-er-text)" : "var(--text-primary)" }}
            >
              {isWarning ? (
                /* Warning bullet — X mark */
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="mt-[3px] shrink-0"
                  style={{ color: "var(--care-er-ring)" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                /* Default bullet — teal dash */
                <span
                  aria-hidden="true"
                  className="mt-[6px] h-[2px] w-3 shrink-0 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
