import type { CareLevel, Confidence } from "@/types/carepath";
import {
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

export function CareLevelHeader({ careLevel, confidence, patientSummary }: Props) {
  const levelStyle = CARE_LEVEL_STYLES[careLevel];

  return (
    <section
      className={`rounded-2xl ring-1 ${levelStyle.ring} bg-white p-6 shadow-sm dark:bg-zinc-950 sm:p-8`}
    >
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Recommended care level
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">{CARE_LEVEL_LABELS[careLevel]}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${CONFIDENCE_STYLES[confidence]}`}
        >
          {CONFIDENCE_LABELS[confidence]}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {patientSummary}
      </p>
    </section>
  );
}
