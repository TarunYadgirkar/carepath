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
    setImportState(getEpicImport());
  }, []);

  if (importState === undefined) {
    return null;
  }

  if (importState === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">No health records connected</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          Connect your health records from Epic MyChart to see your medications, allergies, lab results, and recent
          visits here.
        </p>
        <ConnectHealthRecordsButton />
        <Link href="/" className="text-sm text-[var(--accent)] underline">
          Back home
        </Link>
      </main>
    );
  }

  const { record, systemName, importedAt } = importState;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Health Records</p>
        <h1 className="mt-2 text-2xl font-semibold">{record.patient.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          DOB {record.patient.dob} · MRN {record.patient.mrn}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Imported from {systemName} on {new Date(importedAt).toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{record.patient.facility}</p>
      </header>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Medications</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {record.medications.map((med) => (
            <li key={med.name} className="text-sm">
              <p className="font-medium">{med.name}</p>
              <p className="text-zinc-500">
                {med.frequency} — prescribed by {med.prescriber}, started {med.started}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Allergies</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {record.allergies.map((allergy) => (
            <li key={allergy.substance} className="text-sm">
              <p className="font-medium">{allergy.substance}</p>
              <p className="text-zinc-500">
                {allergy.reaction} — {allergy.severity}, recorded {allergy.recorded}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Lab Results</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {record.labResults.map((lab) => (
            <li key={lab.name} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{lab.name}</p>
                <p className="text-zinc-500">
                  {lab.value} · {lab.date}
                </p>
                <p className="text-xs text-zinc-400">{lab.reference}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${LAB_FLAG_STYLES[lab.flag]}`}>
                {lab.flag.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent Encounters</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {record.recentEncounters.map((enc) => (
            <li key={`${enc.date}-${enc.type}`} className="text-sm">
              <p className="font-medium">{enc.type}</p>
              <p className="text-zinc-500">
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
