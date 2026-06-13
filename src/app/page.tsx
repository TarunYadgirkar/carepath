"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { ConnectHealthRecordsButton } from "@/components/epic/ConnectHealthRecordsButton";
import { ModeCard } from "@/components/hub/ModeCard";
import { getMedCard } from "@/lib/medcard";

/* ── Mode definitions ──────────────────────────────────────────────────── */

const MODES = [
  {
    href: "/intake",
    badge: "Pre-Visit",
    headline: "Don't know where to go?",
    sub: "Describe your symptoms. Get a care recommendation and cost estimate.",
    accent: "blue" as const,
    featured: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6.5v4M10 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/debrief",
    badge: "Post-Visit",
    headline: "Just left the doctor?",
    sub: "Describe what you were told. Get a plain-language explanation and next steps.",
    accent: "green" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 10.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/medcard",
    badge: "Ongoing",
    headline: "Know your medications",
    sub: "Speak your medications and allergies. Get a shareable card and interaction check.",
    accent: "purple" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7h6M7 10h4M7 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/signal",
    badge: "Ongoing",
    headline: "How have you been feeling?",
    sub: "A short voice check-in. CarePath notes what to bring up with your provider.",
    accent: "teal" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 10c1.5-4 4-6 7-6s5.5 2 7 6c-1.5 4-4 6-7 6s-5.5-2-7-6Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/timeline",
    badge: "Ongoing",
    headline: "Symptom timeline",
    sub: "Log symptoms and events over time. Your history is available when you run a check-in.",
    accent: "amber" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10h12M4 6h8M4 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="6" r="1.5" fill="currentColor" />
        <circle cx="12" cy="14" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

/* ── Trust signal strip ──────────────────────────────────────────────── */

const TRUST_SIGNALS = [
  { label: "Voice-first", desc: "Talk naturally — no forms to fill" },
  { label: "Private by design", desc: "Nothing leaves your device" },
  { label: "Clear next step", desc: "A ranked care option with cost estimate" },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function Home() {
  const [hasMedCard, setHasMedCard] = useState(false);

  useEffect(() => {
    const medCard = getMedCard();
    const has = Boolean(
      medCard &&
        (medCard.medications.length || medCard.allergies.length || medCard.conditions.length),
    );
    queueMicrotask(() => setHasMedCard(has));
  }, []);

  return (
    <main
      className="relative flex flex-1 flex-col items-center overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="flex w-full flex-col items-center px-6 pb-12 pt-20 text-center"
      >
        {/* Eyebrow */}
        <p
          className="animate-fade-up stagger-1 mb-4 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--accent)" }}
        >
          Voice-first patient navigation
        </p>

        {/* Display headline — Fraunces for warmth and authority */}
        <h1
          id="hero-heading"
          className="font-display animate-fade-up stagger-2 max-w-2xl text-5xl leading-[1.08] sm:text-6xl lg:text-7xl"
          style={{ color: "var(--text-primary)", fontWeight: 600, letterSpacing: "-0.02em" }}
        >
          Tell it what&apos;s wrong.
          <br />
          <span style={{ color: "var(--accent)" }}>It tells you where to go.</span>
        </h1>

        {/* Sub-headline — Geist, muted, breathing room */}
        <p
          className="animate-fade-up stagger-3 mt-6 max-w-lg text-lg leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Describe your symptoms, meds, and insurance once. CarePath shows you where to go and what it may cost.
        </p>

        {/* CTA cluster */}
        <div className="animate-fade-up stagger-4 mt-8 flex flex-wrap items-center justify-center gap-3">
          {/* Primary CTA */}
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="3" fill="currentColor" />
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            </svg>
            Describe your symptoms
          </Link>

          {/* Secondary: Epic connect */}
          <ConnectHealthRecordsButton />
        </div>

        {/* Med-card status pill */}
        {hasMedCard && (
          <div className="mt-3 animate-fade-in">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 5l1.5 1.5L7 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Medications on file
            </span>
          </div>
        )}
      </section>

      {/* ── Trust signal strip ─────────────────────────────────────────────── */}
      <div
        className="animate-fade-up stagger-5 w-full"
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap">
          {TRUST_SIGNALS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-1 basis-full flex-col gap-0.5 px-8 py-5 text-center sm:basis-0 sm:text-left"
              style={i > 0 ? { borderLeft: "1px solid var(--border)" } : undefined}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {s.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mode cards grid ───────────────────────────────────────────────── */}
      <section
        aria-labelledby="modes-heading"
        className="w-full max-w-4xl px-6 py-14"
      >
        <header className="mb-8 flex flex-col gap-1">
          <h2
            id="modes-heading"
            className="font-display text-2xl font-semibold"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
          >
            What do you need today?
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Choose what fits where you are right now.
          </p>
        </header>

        {/*
          Intentional asymmetric grid:
          — Featured Pre-Visit card spans full width on mobile, gets extra vertical space
          — Remaining 4 in a 2-col grid
        */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Featured card — row-span on larger screens */}
          <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4">
            <div className="animate-fade-up stagger-1">
              <ModeCard {...MODES[0]} featured />
            </div>

            {/* Debrief alongside the featured card */}
            <div className="mt-4 animate-fade-up stagger-2 sm:mt-0">
              <ModeCard {...MODES[1]} />
            </div>
          </div>

          {/* Remaining 3 cards */}
          {MODES.slice(2).map((mode, i) => (
            <div
              key={mode.href}
              className={`animate-fade-up stagger-${i + 3}`}
            >
              <ModeCard {...mode} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Safety disclaimer ─────────────────────────────────────────────── */}
      <footer className="w-full max-w-4xl px-6 pb-16 pt-4">
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <SafetyDisclaimer />
        </div>
      </footer>
    </main>
  );
}
