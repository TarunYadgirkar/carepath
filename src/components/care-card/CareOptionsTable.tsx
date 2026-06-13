import type { CareLevel, CareOption } from "@/types/carepath";
import { CARE_LEVEL_ICONS, CARE_LEVEL_LABELS } from "./care-level-styles";

type Props = {
  options: CareOption[];
  recommendedCareLevel: CareLevel;
  insurancePlan?: string;
  deductibleRemaining?: number;
};

const FIT_STYLES: Record<CareOption["medicalFit"], { bg: string; text: string; border: string; label: string }> = {
  low:    { bg: "var(--surface-2)",     text: "var(--text-muted)",    border: "var(--border)",        label: "Low fit"    },
  medium: { bg: "var(--care-urgent-bg)", text: "var(--care-urgent-text)", border: "var(--care-urgent-border)", label: "Medium fit" },
  high:   { bg: "var(--care-self-bg)",  text: "var(--care-self-text)", border: "var(--care-self-border)", label: "High fit" },
};

export function CareOptionsTable({ options, recommendedCareLevel, insurancePlan, deductibleRemaining }: Props) {
  if (options.length === 0) return null;

  return (
    <section
      aria-labelledby="care-options-heading"
      className="rounded-[var(--radius-xl)] ring-1"
      style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="p-5 pb-4">
        <h2
          id="care-options-heading"
          className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Care options &amp; estimated cost
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[520px] text-left text-sm"
          aria-label="Care options comparison"
        >
          <thead>
            <tr
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{
                color: "var(--text-subtle)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th className="px-5 py-2.5 font-semibold">Option</th>
              <th className="px-3 py-2.5 font-semibold">Medical fit</th>
              <th className="px-3 py-2.5 font-semibold">Wait</th>
              <th className="px-3 py-2.5 font-semibold">Est. cost</th>
              <th className="px-5 py-2.5 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const isRecommended = option.type === recommendedCareLevel;
              const fit = FIT_STYLES[option.medicalFit];
              return (
                <tr
                  key={option.type}
                  className="align-top"
                  style={{
                    background: isRecommended ? "var(--surface-2)" : "transparent",
                    borderBottom: "1px solid var(--border)",
                  }}
                  aria-current={isRecommended ? "true" : undefined}
                  aria-label={isRecommended ? `${CARE_LEVEL_LABELS[option.type]} — recommended` : undefined}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2.5">
                      {/* Level icon — static SVG from Foundation constants, not user input */}
                      <span
                        aria-hidden="true"
                        className="mt-[2px] shrink-0"
                        style={{ color: "var(--text-muted)", fontSize: 0 }}
                        dangerouslySetInnerHTML={{ __html: CARE_LEVEL_ICONS[option.type] }}
                      />
                      <div>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {CARE_LEVEL_LABELS[option.type]}
                        </span>
                        {isRecommended && (
                          <span
                            className="ml-2 inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide"
                            style={{
                              background: "var(--accent)",
                              color: "var(--accent-contrast)",
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-xs font-medium ring-1"
                      style={{
                        background: fit.bg,
                        color: fit.text,
                        borderColor: fit.border,
                      }}
                      aria-label={`Medical fit: ${fit.label}`}
                    >
                      {fit.label}
                    </span>
                  </td>
                  <td
                    className="px-3 py-4 whitespace-nowrap text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {option.waitTime}
                  </td>
                  <td
                    className="px-3 py-4 whitespace-nowrap text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {option.estimatedCost}
                  </td>
                  <td
                    className="px-5 py-4 text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {option.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p
        className="px-5 py-4 text-xs leading-relaxed"
        style={{ color: "var(--text-subtle)", borderTop: "1px solid var(--border)" }}
      >
        {insurancePlan && (
          <>
            Based on your{" "}
            <span className="font-semibold" style={{ color: "var(--text-muted)" }}>
              {insurancePlan}
            </span>{" "}
            plan
            {typeof deductibleRemaining === "number" && (
              <> (~${deductibleRemaining.toLocaleString()} left on your deductible)</>
            )}
            .{" "}
          </>
        )}
        These are estimates, not bills — actual cost depends on the visit, provider, and how much of
        your deductible you&apos;ve met.
      </p>
    </section>
  );
}
