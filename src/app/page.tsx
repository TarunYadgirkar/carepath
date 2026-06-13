"use client";

import { useEffect, useState } from "react";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { ConnectHealthRecordsButton } from "@/components/epic/ConnectHealthRecordsButton";
import { ModeCard } from "@/components/hub/ModeCard";
import { getMedCard } from "@/lib/medcard";

const MODES = [
  {
    href: "/intake",
    badge: "Pre-Visit",
    headline: "Don't know where to go?",
    sub: "Describe your symptoms. Get a care recommendation and cost estimate.",
    accent: "blue" as const,
  },
  {
    href: "/debrief",
    badge: "Post-Visit",
    headline: "Just left the doctor?",
    sub: "Describe what you were told. Get a plain-language explanation and next steps.",
    accent: "green" as const,
  },
  {
    href: "/medcard",
    badge: "Ongoing",
    headline: "Know your medications",
    sub: "Speak your medications and allergies. Get a shareable card and interaction check.",
    accent: "purple" as const,
  },
  {
    href: "/signal",
    badge: "Ongoing",
    headline: "How have you been feeling?",
    sub: "A short voice check-in. CarePath notes what to bring up with your provider.",
    accent: "amber" as const,
  },
];

export default function Home() {
  const [hasMedCard, setHasMedCard] = useState(false);

  useEffect(() => {
    const medCard = getMedCard();
    const has = Boolean(medCard && (medCard.medications.length || medCard.allergies.length || medCard.conditions.length));
    queueMicrotask(() => setHasMedCard(has));
  }, []);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-24 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-12rem] -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_var(--accent-soft),_transparent_70%)]"
      />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        Your personal healthcare center
      </p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">CarePath</h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Tell it what&apos;s wrong. It tells you where to go, what it may cost, and what to
        bring.
      </p>

      <section aria-labelledby="modes" className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <h2 id="modes" className="sr-only">
          Choose what you need
        </h2>
        {MODES.map((mode) => (
          <ModeCard key={mode.href} {...mode} />
        ))}
      </section>

      <div className="mt-8 flex flex-col items-center gap-3">
        <ConnectHealthRecordsButton />
        {hasMedCard && (
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            Medications on file
          </span>
        )}
      </div>

      <div className="mt-16">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
