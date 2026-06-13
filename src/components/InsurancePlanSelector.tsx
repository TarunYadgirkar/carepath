import { syntheticPricing } from "@/data/synthetic-pricing";

type Props = {
  value: string;
  onChange: (planKey: string) => void;
  disabled?: boolean;
};

export function InsurancePlanSelector({ value, onChange, disabled }: Props) {
  const planKeys = Object.keys(syntheticPricing.plans);

  return (
    <fieldset className="flex w-full flex-col items-center gap-2.5" disabled={disabled}>
      <legend
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-subtle)" }}
      >
        Insurance plan
      </legend>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Select insurance plan">
        {planKeys.map((key) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              disabled={disabled}
              aria-pressed={isSelected}
              className="min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40"
              style={
                isSelected
                  ? {
                      background: "var(--accent)",
                      color: "var(--accent-contrast)",
                      boxShadow: "var(--shadow-sm)",
                    }
                  : {
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {key}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
