"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LAB_FLAG_STYLES } from "@/data/epic-mock";
import { getEpicImport, type EpicImportState } from "@/lib/epic-import";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { ConnectHealthRecordsButton } from "@/components/epic/ConnectHealthRecordsButton";

export default function RecordsPage() {
  const [importState, setImportState] = useState<EpicImportState | null | undefined>(undefined);

  useEffect(() => {
    const state = getEpicImport();
    queueMicrotask(() => setImportState(state));
  }, []);

  if (importState === undefined) {
    return null;
  }

  if (importState === null) {
    return (
      <main
        className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center"
      >
        <div className="animate-fade-up flex flex-col items-center gap-4">
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
            No records connected
          </h1>
          <p
            className="max-w-sm text-base leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Connect your health records from Epic MyChart to see your medications, allergies,
            lab results, and recent visits here.
          </p>
        </div>

        <div className="animate-fade-up stagger-2 flex flex-col items-center gap-3">
          <ConnectHealthRecordsButton />
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ color: "var(--accent)" }}
          >
            Back home
          </Link>
        </div>

        <div className="animate-fade-up stagger-3">
          <SafetyDisclaimer />
        </div>
      </main>
    );
  }

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

      <div className="flex justify-center py-4">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
