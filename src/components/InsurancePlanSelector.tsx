import { syntheticPricing } from "@/data/synthetic-pricing";

type Props = {
  value: string;
  onChange: (planKey: string) => void;
  disabled?: boolean;
};

export function InsurancePlanSelector({ value, onChange, disabled }: Props) {
  const planKeys = Object.keys(syntheticPricing.plans);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Insurance plan</p>
      <div className="flex flex-wrap justify-center gap-2">
        {planKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            disabled={disabled}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
              value === key
                ? "bg-[var(--accent)] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
