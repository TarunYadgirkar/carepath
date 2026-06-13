import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        CarePath
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm text-zinc-500">
        <Link href="/" className="transition-colors hover:text-[var(--accent)]">
          Home
        </Link>
        <Link href="/records" className="transition-colors hover:text-[var(--accent)]">
          Records
        </Link>
        <Link href="/card" className="transition-colors hover:text-[var(--accent)]">
          Care Card
        </Link>
      </nav>
    </header>
  );
}
