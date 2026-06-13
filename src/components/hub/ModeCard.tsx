import Link from "next/link";

type ModeAccent = "blue" | "green" | "purple" | "amber";

type Props = {
  href: string;
  badge: string;
  headline: string;
  sub: string;
  accent: ModeAccent;
};

const ACCENT_STYLES: Record<ModeAccent, { ring: string; badge: string; hover: string }> = {
  blue: {
    ring: "ring-blue-200 dark:ring-blue-900",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    hover: "hover:border-blue-400",
  },
  green: {
    ring: "ring-emerald-200 dark:ring-emerald-900",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    hover: "hover:border-emerald-400",
  },
  purple: {
    ring: "ring-purple-200 dark:ring-purple-900",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    hover: "hover:border-purple-400",
  },
  amber: {
    ring: "ring-amber-200 dark:ring-amber-900",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    hover: "hover:border-amber-400",
  },
};

export function ModeCard({ href, badge, headline, sub, accent }: Props) {
  const styles = ACCENT_STYLES[accent];

  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 rounded-2xl border border-transparent bg-white p-5 text-left ring-1 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950 ${styles.ring} ${styles.hover}`}
    >
      <span className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>{badge}</span>
      <h3 className="text-lg font-semibold">{headline}</h3>
      <p className="text-sm text-zinc-500">{sub}</p>
    </Link>
  );
}
