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
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      {/* Modal card */}
      <div
        className="w-full max-w-sm animate-fade-up"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* ── SELECT ───────────────────────────────────────────────────────── */}
        {step === "select" && (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
                style={{ color: "var(--accent)" }}
              >
                <rect x="2" y="1" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.25" />
                <path d="M5 6h8M5 9.5h8M5 13h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Connect Health Records
              </h2>
            </div>
            <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
              Select your health system — simulated SMART on FHIR, no real data sent.
            </p>

            {/* Search */}
            <div className="relative mb-3">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-subtle)" }}
              >
                <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.25" />
                <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search health systems…"
                className="w-full rounded-xl py-2 pl-8 pr-4 text-sm outline-none transition-colors duration-[var(--duration-fast)]"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* System list */}
            <div
              className="flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-0.5"
              style={{ scrollbarWidth: "thin" }}
            >
              {filteredSystems.length === 0 && (
                <p
                  className="py-6 text-center text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No health systems match &quot;{search}&quot;.
                </p>
              )}
              {filteredSystems.map((sys) => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => handleSelect(sys)}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-[var(--duration-fast)] hover:scale-[1.01] focus-visible:outline-2"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "var(--accent)";
                    el.style.background = "var(--accent-soft)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "var(--border)";
                    el.style.background = "transparent";
                  }}
                >
                  <span className="text-base" aria-hidden="true">{sys.logo}</span>
                  {sys.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full py-2 text-sm font-medium transition-all duration-[var(--duration-fast)] hover:opacity-70"
              style={{
                border: "1px solid var(--border-strong)",
                color: "var(--text-muted)",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── CONNECTING ───────────────────────────────────────────────────── */}
        {step === "connecting" && system && (
          <div className="flex flex-col items-center gap-5 p-8 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--accent-soft)" }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                style={{
                  borderColor: "var(--accent-soft)",
                  borderTopColor: "var(--accent)",
                }}
              />
            </div>
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Connecting to {system.name}
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Simulated SMART on FHIR authorization
              </p>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="h-full w-full origin-left animate-[connect-progress_2s_ease-out_forwards]"
                style={{ background: "var(--accent)" }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
              No real data is sent.
            </p>
          </div>
        )}

        {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
        {step === "success" && system && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            {/* Check icon */}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--care-tele-bg)", border: "1px solid var(--care-tele-border)" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                style={{ color: "var(--care-tele-text)" }}
              >
                <polyline
                  points="20 6 9 17 4 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Records imported from {system.name}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {EPIC_FHIR_MOCK.medications.length} medications ·{" "}
                {EPIC_FHIR_MOCK.allergies.length} allerg
                {EPIC_FHIR_MOCK.allergies.length === 1 ? "y" : "ies"} ·{" "}
                {EPIC_FHIR_MOCK.conditions.length} conditions ·{" "}
                {EPIC_FHIR_MOCK.labResults.length} lab results ·{" "}
                {EPIC_FHIR_MOCK.recentEncounters.length} recent visits
              </p>
            </div>

            <div className="mt-1 flex w-full flex-col gap-2">
              <Link
                href="/records"
                onClick={onClose}
                className="w-full rounded-full py-2.5 text-center text-sm font-semibold transition-all duration-[var(--duration-fast)] hover:scale-[1.01] hover:opacity-90 active:scale-[0.99]"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                View imported records
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full py-2.5 text-sm font-medium transition-opacity duration-[var(--duration-fast)] hover:opacity-70"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-muted)",
                }}
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
