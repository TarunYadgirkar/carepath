type Props = {
  signals: string[];
};

export function RiskSignalTags({ signals }: Props) {
  if (signals.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Risk signals noted
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {signals.map((signal) => (
          <span
            key={signal}
            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
          >
            {signal}
          </span>
        ))}
      </div>
    </section>
  );
}
