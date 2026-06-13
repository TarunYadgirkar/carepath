import type { CareLevel, Confidence } from "@/types/carepath";
import {
  CARE_LEVEL_ICONS,
  CARE_LEVEL_LABELS,
  CARE_LEVEL_STYLES,
  CONFIDENCE_LABELS,
  CONFIDENCE_STYLES,
} from "./care-level-styles";

type Props = {
  careLevel: CareLevel;
  confidence: Confidence;
  patientSummary: string;
};

// Map each level to its ring CSS variable for the accent top-strip
const LEVEL_RING_VAR: Record<CareLevel, string> = {
  self_monitor:   "var(--care-self-ring)",
  telehealth:     "var(--care-tele-ring)",
  primary_care:   "var(--care-primary-ring)",
  urgent_care:    "var(--care-urgent-ring)",
  emergency_room: "var(--care-er-ring)",
};

export function CareLevelHeader({ careLevel, confidence, patientSummary }: Props) {
  const levelStyle = CARE_LEVEL_STYLES[careLevel];
  const accentColor = LEVEL_RING_VAR[careLevel];

  return (
    <section
      aria-labelledby="care-level-heading"
      className={`relative overflow-hidden rounded-[var(--radius-2xl)] ring-2 ${levelStyle.ring}`}
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)" }}
    >
      {/* Colored accent strip at top edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: accentColor }}
      />

      <div className="p-6 sm:p-8">
        {/* Eyebrow */}
        <p
          className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Recommended care level
        </p>

        {/* Primary hierarchy — icon + level name + confidence chip */}
        <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            {/* Icon badge — color-coded, aria-hidden since level label follows */}
            {/* Inline SVG from Foundation constants — safe static strings, no user input */}
            <span
              aria-hidden="true"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${levelStyle.badge}`}
              style={{ fontSize: 0 }}
              dangerouslySetInnerHTML={{ __html: CARE_LEVEL_ICONS[careLevel] }}
            />
            <h1
              id="care-level-heading"
              className="font-display text-3xl font-semibold leading-tight sm:text-4xl"
              style={{ color: "var(--text-primary)" }}
            >
              {CARE_LEVEL_LABELS[careLevel]}
            </h1>
          </div>

          {/* Confidence chip — visually subordinate */}
          <span
            className={`mt-[6px] rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${CONFIDENCE_STYLES[confidence]}`}
            aria-label={`AI confidence: ${CONFIDENCE_LABELS[confidence]}`}
          >
            {CONFIDENCE_LABELS[confidence]}
          </span>
        </div>

        {/* Patient summary prose */}
        <p
          className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {patientSummary}
        </p>
      </div>
    </section>
  );
}
