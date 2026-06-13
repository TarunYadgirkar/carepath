type Variant = "default" | "warning";

type Props = {
  title: string;
  items: string[];
  variant?: Variant;
};

const VARIANT_STYLES: Record<Variant, { section: string; marker: string }> = {
  default: { section: "bg-white dark:bg-zinc-950 ring-zinc-200 dark:ring-zinc-800", marker: "text-zinc-400" },
  warning: { section: "bg-red-50 dark:bg-red-950/30 ring-red-200 dark:ring-red-900", marker: "text-red-500" },
};

export function ListSection({ title, items, variant = "default" }: Props) {
  if (items.length === 0) return null;

  const styles = VARIANT_STYLES[variant];

  return (
    <section className={`rounded-2xl p-6 ring-1 ${styles.section}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={styles.marker}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
