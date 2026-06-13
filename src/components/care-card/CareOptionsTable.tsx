import type { CareLevel, CareOption } from "@/types/carepath";

type Props = {
  options: CareOption[];
  recommendedCareLevel: CareLevel;
};

const FIT_STYLES: Record<CareOption["medicalFit"], string> = {
  low: "bg-zinc-100 text-zinc-500",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-emerald-100 text-emerald-900",
};

export function CareOptionsTable({ options, recommendedCareLevel }: Props) {
  if (options.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Care options &amp; estimated cost
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-4">Option</th>
              <th className="py-2 pr-4">Fit</th>
              <th className="py-2 pr-4">Wait</th>
              <th className="py-2 pr-4">Est. cost</th>
              <th className="py-2">Why</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const isRecommended = option.type === recommendedCareLevel;
              return (
                <tr
                  key={option.type}
                  className={`border-b border-zinc-100 align-top last:border-0 dark:border-zinc-900 ${
                    isRecommended ? "bg-zinc-50 dark:bg-zinc-900/50" : ""
                  }`}
                >
                  <td className="py-3 pr-4 font-medium">
                    {option.label}
                    {isRecommended && (
                      <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
                        Recommended
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${FIT_STYLES[option.medicalFit]}`}
                    >
                      {option.medicalFit}
                    </span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{option.waitTime}</td>
                  <td className="py-3 pr-4 whitespace-nowrap font-medium">
                    {option.estimatedCost}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">{option.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
