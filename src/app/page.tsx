import Link from "next/link";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { ConnectHealthRecordsButton } from "@/components/epic/ConnectHealthRecordsButton";

const STEPS = [
  {
    label: "Tell it what's wrong",
    detail: "A short voice conversation about your symptoms, meds, and insurance.",
  },
  {
    label: "Get your care level",
    detail: "Self-care, telehealth, primary care, urgent care, or ER — with reasoning.",
  },
  {
    label: "See cost & next steps",
    detail: "Estimated cost, red flags, what to bring, and what to say at check-in.",
  },
];

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-24 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-12rem] -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_var(--accent-soft),_transparent_70%)]"
      />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Voice-first care navigation
      </p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">CarePath</h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Tell it what&apos;s wrong. It tells you where to go, what it may cost, and what to
        bring.
      </p>

      <Link
        href="/intake"
        className="mt-8 rounded-full bg-[var(--accent)] px-8 py-3 font-medium text-white transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        Start
      </Link>

      <div className="mt-4">
        <ConnectHealthRecordsButton />
      </div>

      <section aria-labelledby="how-it-works" className="mt-20 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
        <h2 id="how-it-works" className="sr-only">
          How CarePath works
        </h2>
        {STEPS.map((step, i) => (
          <div
            key={step.label}
            className="rounded-2xl bg-white p-5 text-left ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
          >
            <span className="text-xs font-semibold text-[var(--accent)]">Step {i + 1}</span>
            <h3 className="mt-1 font-semibold">{step.label}</h3>
            <p className="mt-1 text-sm text-zinc-500">{step.detail}</p>
          </div>
        ))}
      </section>

      <div className="mt-16">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
