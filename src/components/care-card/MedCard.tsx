type Props = {
  medications: string[];
  allergies: string[];
  conditions: string[];
};

function Group({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-400">None reported</p>
      )}
    </div>
  );
}

export function MedCard({ medications, allergies, conditions }: Props) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">MedCard</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <Group title="Medications" items={medications} />
        <Group title="Allergies" items={allergies} />
        <Group title="Conditions" items={conditions} />
      </div>
    </section>
  );
}
