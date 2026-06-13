import type { ReactNode } from "react";

type Props = {
  medications: string[];
  allergies: string[];
  conditions: string[];
};

type GroupProps = {
  title: string;
  items: string[];
  accentVar: string;
  icon: ReactNode;
};

function Group({ title, items, accentVar, icon }: GroupProps) {
  const hasItems = items.length > 0;
  return (
    <div
      className="rounded-[var(--radius-lg)] p-4 ring-1"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <div
        className="flex items-center gap-2 pb-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          aria-hidden="true"
          className="flex items-center"
          style={{ color: `var(${accentVar})` }}
        >
          {icon}
        </span>
        <h3
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-subtle)" }}
        >
          {title}
        </h3>
      </div>

      {hasItems ? (
        <ul className="mt-3 space-y-1.5" role="list">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-[0.8125rem] leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              <span
                aria-hidden="true"
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: `var(${accentVar})` }}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[0.8125rem]" style={{ color: "var(--text-subtle)" }}>
          None reported
        </p>
      )}
    </div>
  );
}

const MedIcon = () => (
  <svg
    aria-hidden="true"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M22 22l-1.5-1.5" />
  </svg>
);

const AllergyIcon = () => (
  <svg
    aria-hidden="true"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ConditionIcon = () => (
  <svg
    aria-hidden="true"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ShieldIcon = () => (
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
    style={{ color: "var(--accent)" }}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export function MedCard({ medications, allergies, conditions }: Props) {
  return (
    <section
      aria-labelledby="medcard-heading"
      className="rounded-[var(--radius-xl)] ring-1"
      style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <ShieldIcon />
        <h2
          id="medcard-heading"
          className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Medical card
        </h2>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <Group title="Medications" items={medications} accentVar="--accent" icon={<MedIcon />} />
        <Group
          title="Allergies"
          items={allergies}
          accentVar="--care-er-ring"
          icon={<AllergyIcon />}
        />
        <Group
          title="Conditions"
          items={conditions}
          accentVar="--care-primary-ring"
          icon={<ConditionIcon />}
        />
      </div>
    </section>
  );
}
