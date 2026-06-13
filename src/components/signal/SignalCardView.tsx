import type { SignalResult } from "@/types/carepath";
import { ListSection } from "@/components/care-card/ListSection";

export function SignalCardView({ result }: { result: SignalResult }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">What you shared</h2>
        <p className="mt-2 text-sm leading-relaxed">{result.patientSummary}</p>
      </section>

      <ListSection title="Themes noticed" items={result.themesNoticed} />
      <ListSection title="What to tell your provider" items={result.whatToTellYourProvider} />
      <ListSection title="Positive observations" items={result.positiveObservations} />
      <ListSection title="Questions to ask your provider" items={result.questionsToAsk} />

      <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Follow-up</h2>
        <p className="mt-2 text-sm leading-relaxed">{result.followUpSuggestion}</p>
      </section>

      {result.resources.length > 0 && (
        <ListSection title="Resources" items={result.resources} />
      )}

      <section className="rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900">
        <p className="text-sm text-amber-900 dark:text-amber-200">{result.disclaimer}</p>
      </section>
    </div>
  );
}
