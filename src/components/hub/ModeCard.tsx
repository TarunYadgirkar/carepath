import type { ReactNode } from "react";
import Link from "next/link";

type ModeAccent = "blue" | "green" | "purple" | "amber" | "teal";

type Props = {
  href: string;
  badge: string;
  headline: string;
  sub: string;
  accent: ModeAccent;
  icon: ReactNode;
  /** Optional: marks the card as visually featured / primary */
  featured?: boolean;
};

const ACCENT_MAP: Record<
  ModeAccent,
  { badgeBg: string; badgeText: string; iconBg: string; iconColor: string; ring: string; lineColor: string }
> = {
  blue: {
    badgeBg:   "var(--care-primary-bg)",
    badgeText: "var(--care-primary-text)",
    iconBg:    "var(--care-primary-bg)",
    iconColor: "var(--care-primary-text)",
    ring:      "var(--care-primary-ring)",
    lineColor: "var(--care-primary-ring)",
  },
  green: {
    badgeBg:   "var(--care-self-bg)",
    badgeText: "var(--care-self-text)",
    iconBg:    "var(--care-self-bg)",
    iconColor: "var(--care-self-text)",
    ring:      "var(--care-self-ring)",
    lineColor: "var(--care-self-ring)",
  },
  teal: {
    badgeBg:   "var(--care-tele-bg)",
    badgeText: "var(--care-tele-text)",
    iconBg:    "var(--care-tele-bg)",
    iconColor: "var(--care-tele-text)",
    ring:      "var(--care-tele-ring)",
    lineColor: "var(--care-tele-ring)",
  },
  purple: {
    badgeBg:   "var(--mode-purple-bg, #ede9fe)",
    badgeText: "var(--mode-purple-text, #4c1d95)",
    iconBg:    "var(--mode-purple-bg, #ede9fe)",
    iconColor: "var(--mode-purple-text, #4c1d95)",
    ring:      "var(--mode-purple-ring, #8b5cf6)",
    lineColor: "var(--mode-purple-ring, #8b5cf6)",
  },
  amber: {
    badgeBg:   "var(--care-urgent-bg)",
    badgeText: "var(--care-urgent-text)",
    iconBg:    "var(--care-urgent-bg)",
    iconColor: "var(--care-urgent-text)",
    ring:      "var(--care-urgent-ring)",
    lineColor: "var(--care-urgent-ring)",
  },
};

export function ModeCard({ href, badge, headline, sub, accent, icon, featured = false }: Props) {
  const a = ACCENT_MAP[accent];

  return (
    <Link
      href={href}
      className="mode-card group relative flex flex-col gap-4 rounded-2xl p-5 text-left transition-all"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        borderLeft: `3px solid ${a.lineColor}`,
      }}
      aria-label={`${headline} — ${badge}`}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between gap-3">
        {/* Icon container */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          aria-hidden="true"
          style={{ background: a.iconBg, color: a.iconColor }}
        >
          {icon}
        </div>

        {/* Badge */}
        <span
          className="self-start rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"
          style={{ background: a.badgeBg, color: a.badgeText }}
        >
          {badge}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5">
        <h3
          className={`font-display leading-snug ${featured ? "text-xl" : "text-base"}`}
          style={{ color: "var(--text-primary)", fontWeight: 600 }}
        >
          {headline}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      </div>

      {/* Arrow caret — designed, not decorative */}
      <div
        className="mt-auto flex items-center gap-1.5 text-xs font-semibold transition-transform duration-200 group-hover:translate-x-1"
        style={{ color: a.lineColor }}
        aria-hidden="true"
      >
        Open
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* React 19 deduplicates <style> by href — safe to co-locate here */}
      <style href="mode-card-styles" precedence="component">{`
        :root {
          --mode-purple-bg:   #ede9fe;
          --mode-purple-text: #4c1d95;
          --mode-purple-ring: #8b5cf6;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --mode-purple-bg:   #2e1065;
            --mode-purple-text: #ddd6fe;
            --mode-purple-ring: #a78bfa;
          }
        }
        .mode-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
          transform: translateY(-2px);
        }
        .mode-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }
      `}</style>
    </Link>
  );
}
