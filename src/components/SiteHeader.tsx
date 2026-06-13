import Link from "next/link";

const NAV_LINKS = [
  { href: "/",        label: "Home"      },
  { href: "/records", label: "Records"   },
  { href: "/card",    label: "Care Card" },
] as const;

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        {/* Wordmark — display serif per design spec */}
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight transition-opacity hover:opacity-75"
          style={{ color: "var(--text-primary)" }}
          aria-label="CarePath — home"
        >
          Care<span style={{ color: "var(--accent)" }}>Path</span>
        </Link>

        {/* Primary navigation */}
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-1 text-sm" role="list">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="nav-link rounded px-3 py-2 font-medium transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <style>{`
        .nav-link:hover {
          color: var(--accent);
          background: var(--accent-soft);
        }
        .nav-link:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </header>
  );
}
