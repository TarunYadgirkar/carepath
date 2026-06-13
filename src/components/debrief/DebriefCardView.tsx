import type { DebriefResult } from "@/types/carepath";
import { ListSection } from "@/components/care-card/ListSection";
import { MedCard } from "@/components/care-card/MedCard";

export function DebriefCardView({ result }: { result: DebriefResult }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">What the doctor said</h2>
        <p className="mt-2 text-sm text-zinc-500">{result.patientSummary}</p>
        <p className="mt-3 text-sm leading-relaxed">{result.whatTheDoctorSaid}</p>
      </section>

      <ListSection title="Key facts" items={result.keyFacts} />

      <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Next step</h2>
        <p className="mt-2 text-sm leading-relaxed">{result.recommendedNextStep}</p>
        <p className="mt-2 text-sm text-zinc-500">Follow-up: {result.followUpTiming}</p>
      </section>

      <ListSection
        title="Flagged for clarification or second opinion"
        items={result.flaggedConcerns}
        variant="warning"
      />

      <MedCard medications={result.medications} allergies={result.allergies} conditions={result.conditions} />

      <ListSection title="Questions to ask at your follow-up" items={result.questionsToAsk} />
      <ListSection title="What to bring" items={result.whatToBring} />
      <ListSection title="Go back sooner if" items={result.redFlags} variant="warning" />
    </div>
  );
}
