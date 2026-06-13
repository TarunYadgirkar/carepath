"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EPIC_FHIR_MOCK, EPIC_SYSTEMS, type EpicSystem } from "@/data/epic-mock";
import { saveEpicImport } from "@/lib/epic-import";
import { saveMedCard } from "@/lib/medcard";

type Step = "select" | "connecting" | "success";

type Props = {
  onClose: () => void;
};

const CONNECT_DELAY_MS = 2000;

export function ConnectHealthRecordsModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>("select");
  const [system, setSystem] = useState<EpicSystem | null>(null);
  const [search, setSearch] = useState("");

  const filteredSystems = EPIC_SYSTEMS.filter((sys) =>
    sys.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  useEffect(() => {
    if (step !== "connecting" || !system) return;
    const timer = setTimeout(() => {
      saveEpicImport(system.id, system.name);
      saveMedCard({
        medications: EPIC_FHIR_MOCK.medications.map((m) => m.name),
        allergies: EPIC_FHIR_MOCK.allergies.map((a) => a.substance),
        conditions: EPIC_FHIR_MOCK.conditions.map((c) => c.name),
      });
      setStep("success");
    }, CONNECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step, system]);

  const handleSelect = (selected: EpicSystem) => {
    setSystem(selected);
    setStep("connecting");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        {step === "select" && (
          <>
            <h2 className="text-lg font-semibold">Connect Health Records</h2>
            <p className="mt-1 text-sm text-zinc-500">Select your health system</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search health systems…"
              className="mt-3 w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />
            <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              {filteredSystems.length === 0 && (
                <p className="py-4 text-center text-sm text-zinc-500">No health systems match &quot;{search}&quot;.</p>
              )}
              {filteredSystems.map((sys) => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => handleSelect(sys)}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] dark:border-zinc-800"
                >
                  <span className="text-xl">{sys.logo}</span>
                  {sys.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full border border-current px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </>
        )}

        {step === "connecting" && system && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <h2 className="text-lg font-semibold">Connecting to {system.name}...</h2>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full w-full origin-left animate-[connect-progress_2s_ease-out_forwards] bg-[var(--accent)]" />
            </div>
            <p className="text-xs text-zinc-500">Simulated SMART on FHIR authorization — no real data is sent.</p>
          </div>
        )}

        {step === "success" && system && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <h2 className="text-lg font-semibold">Records imported from {system.name}</h2>
            <p className="text-sm text-zinc-500">
              Found: {EPIC_FHIR_MOCK.medications.length} medications · {EPIC_FHIR_MOCK.allergies.length} allergy
              {EPIC_FHIR_MOCK.allergies.length === 1 ? "" : "ies"} · {EPIC_FHIR_MOCK.conditions.length} conditions ·{" "}
              {EPIC_FHIR_MOCK.labResults.length} lab results · {EPIC_FHIR_MOCK.recentEncounters.length} recent visits
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Link
                href="/records"
                onClick={onClose}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                View imported records
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-current px-4 py-2 text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
