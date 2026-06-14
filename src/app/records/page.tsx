"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LAB_FLAG_STYLES } from "@/data/epic-mock";
import {
  getEpicImport,
  saveEpicImport,
  clearEpicImport,
  RECORDS_CHANGED_EVENT,
  type EpicImportState,
} from "@/lib/epic-import";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { ConnectHealthRecordsButton } from "@/components/epic/ConnectHealthRecordsButton";

/* ── External store wiring ─────────────────────────────────────────────── */

type Snapshot = EpicImportState | null | undefined;

let _cachedSnapshot: Snapshot = undefined;
const _listeners = new Set<() => void>();

function _notify() {
  _cachedSnapshot = undefined;
  _listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  _listeners.add(cb);
  // Refresh when records change anywhere (e.g. the Epic import modal), not just
  // via this page's own actions.
  const onExternalChange = () => {
    _cachedSnapshot = undefined;
    cb();
  };
  if (typeof window !== "undefined") {
    window.addEventListener(RECORDS_CHANGED_EVENT, onExternalChange);
  }
  return () => {
    _listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener(RECORDS_CHANGED_EVENT, onExternalChange);
    }
  };
}

function getSnapshot(): Snapshot {
  if (_cachedSnapshot !== undefined) return _cachedSnapshot;
  _cachedSnapshot = getEpicImport();
  return _cachedSnapshot;
}

function getServerSnapshot(): Snapshot {
  return undefined;
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function RecordsPage() {
  const importState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleLoadDemo = useCallback(() => {
    setLoadingDemo(true);
    saveEpicImport("sutter", "Sutter Health");
    _notify();
    setLoadingDemo(false);
  }, []);

  const handleClear = useCallback(() => {
    clearEpicImport();
    _notify();
  }, []);

  if (importState === undefined) {
    return null;
  }

  /* ── Empty state ───────────────────────────────────────────────────── */
  if (importState === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <div className="animate-fade-up flex flex-col items-center gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--accent)" }}
          >
            Health Records
          </p>
          <h1
            className="font-display text-4xl leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            No records yet
          </h1>
          <p
            className="max-w-sm text-base leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Connect your health records or add medications to give CarePath the context it
            needs.
          </p>
        </div>

        <div
          className="animate-fade-up stagger-2 w-full max-w-sm rounded-[var(--radius-xl)] p-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <ul className="flex flex-col gap-4">
            {/* Epic MyChart */}
            <li className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                From your health system
              </p>
              <ConnectHealthRecordsButton />
            </li>

            {/* Divider */}
            <li aria-hidden="true" style={{ borderTop: "1px solid var(--border)" }} />

            {/* Medications via medcard */}
            <li className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                Add medications manually
              </p>
              <Link
                href="/medcard"
                className="inline-flex items-center gap-2 rounded-[var(--radius-2xl)] px-5 py-2.5 text-sm font-medium transition-all duration-[var(--duration-normal)] hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
                  <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
                Go to Medication Card
              </Link>
            </li>

            {/* Divider */}
            <li aria-hidden="true" style={{ borderTop: "1px solid var(--border)" }} />

            {/* Demo data */}
            <li className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-subtle)" }}>
                Explore with sample data
              </p>
              <button
                type="button"
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                className="inline-flex items-center gap-2 rounded-[var(--radius-2xl)] px-5 py-2.5 text-sm font-medium transition-all duration-[var(--duration-normal)] hover:scale-[1.02] hover:opacity-80 active:scale-[0.98] disabled:opacity-50"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  background: "var(--surface-2)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.25" />
                  <path d="M7 4.5v2.75L8.5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {loadingDemo ? "Loading…" : "Load example data"}
              </button>
              <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                Loads Maya Patel&apos;s simulated record — for judges and demos only.
              </p>
            </li>
          </ul>
        </div>

        <div className="animate-fade-up stagger-3">
          <SafetyDisclaimer />
        </div>
      </main>
    );
  }

  /* ── Data view ─────────────────────────────────────────────────────── */
  const { record, systemName, importedAt } = importState;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="animate-fade-up text-center">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--accent)" }}
        >
          Health Records
        </p>
        <h1
          className="font-display mt-2 text-3xl leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {record.patient.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          DOB {record.patient.dob} · MRN {record.patient.mrn}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-subtle)" }}>
          Imported from {systemName} on {new Date(importedAt).toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-subtle)" }}>
          {record.patient.facility}
        </p>
      </header>

      {/* Medications */}
      <section
        className="animate-fade-up stagger-1 rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Medications
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {record.medications.map((med) => (
            <li key={med.name} className="text-sm">
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {med.name}
              </p>
              <p className="mt-0.5" style={{ color: "var(--text-muted)" }}>
                {med.frequency} — prescribed by {med.prescriber}, started {med.started}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Allergies */}
      <section
        className="animate-fade-up stagger-2 rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Allergies
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {record.allergies.map((allergy) => (
            <li key={allergy.substance} className="text-sm">
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {allergy.substance}
              </p>
              <p className="mt-0.5" style={{ color: "var(--text-muted)" }}>
                {allergy.reaction} — {allergy.severity}, recorded {allergy.recorded}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Lab Results */}
      <section
        className="animate-fade-up stagger-3 rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Lab Results
        </h2>
        <ul className="mt-4 flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {record.labResults.map((lab) => (
            <li
              key={lab.name}
              className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 text-sm"
            >
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {lab.name}
                </p>
                <p className="mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {lab.value} · {lab.date}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-subtle)" }}>
                  {lab.reference}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${LAB_FLAG_STYLES[lab.flag]}`}
              >
                {lab.flag.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent Encounters */}
      <section
        className="animate-fade-up stagger-4 rounded-[var(--radius-xl)] p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Recent Encounters
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {record.recentEncounters.map((enc) => (
            <li key={`${enc.date}-${enc.type}`} className="text-sm">
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {enc.type}
              </p>
              <p className="mt-0.5" style={{ color: "var(--text-muted)" }}>
                {enc.date} — {enc.provider}, {enc.facility}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Reset */}
      <div className="animate-fade-up stagger-5 flex justify-center py-2">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium transition-colors duration-[var(--duration-fast)] hover:opacity-70"
          style={{ color: "var(--text-subtle)" }}
        >
          Reset / clear records
        </button>
      </div>

      <div className="flex justify-center pb-4">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
