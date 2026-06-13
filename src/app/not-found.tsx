import Link from "next/link";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="animate-fade-up flex flex-col items-center gap-4">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-subtle)" }}
        >
          404
        </p>
        <h1
          className="font-display text-4xl leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p
          className="max-w-sm text-base leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className="animate-fade-up stagger-2 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-full px-8 py-3 text-sm font-semibold transition-all"
          style={{
            background: "var(--accent)",
            color: "var(--accent-contrast)",
          }}
        >
          Back to CarePath
        </Link>
      </div>

      <div className="animate-fade-up stagger-3">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
