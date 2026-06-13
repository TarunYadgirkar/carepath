import type { MedCardResult } from "@/types/carepath";
import { ListSection } from "@/components/care-card/ListSection";
import { MedCard } from "@/components/care-card/MedCard";

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  moderate: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300",
};

export function MedCardResultView({ result }: { result: MedCardResult }) {
  return (
    <div id="medcard-export" className="flex flex-col gap-4 bg-[var(--background)] p-1">
      <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Summary</h2>
        <p className="mt-2 text-sm leading-relaxed">{result.patientSummary}</p>
      </section>

      <MedCard medications={result.medications} allergies={result.allergies} conditions={result.conditions} />

      {result.interactions.length > 0 && (
        <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Interactions</h2>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            AI estimate — not a substitute for a pharmacist or prescriber. Verify before changing medications.
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {result.interactions.map((interaction) => (
              <li key={interaction.drugs.join("+")} className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{interaction.drugs.join(" + ")}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[interaction.severity]}`}>
                    {interaction.severity}
                  </span>
                </div>
                <p className="text-zinc-500">{interaction.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ListSection title="Questions to ask your doctor" items={result.questionsToAsk} />
    </div>
  );
}
