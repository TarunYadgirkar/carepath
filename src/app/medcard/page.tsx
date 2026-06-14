"use client";

import { useCallback, useState } from "react";
import type { MedCardResult } from "@/types/carepath";
import { saveMedCard, clearMedCard } from "@/lib/medcard";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { VoiceConversationPanel } from "@/components/voice/VoiceConversationPanel";
import { MedCardResultView } from "@/components/medcard/MedCardResultView";
import { DownloadMedCardButton } from "@/components/medcard/DownloadMedCardButton";
import { ConnectHealthRecordsButton } from "@/components/epic/ConnectHealthRecordsButton";
import { PillBottleScanner } from "@/components/medcard/PillBottleScanner";

export default function MedCardPage() {
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<MedCardResult | null>(null);
  const [classifyError, setClassifyError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    clearMedCard();
    setResult(null);
    setClassifyError(null);
  }, []);

  const classify = useCallback(async (transcript: string) => {
    setClassifying(true);
    setClassifyError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, mode: "medcard" }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: MedCardResult = await res.json();
      if (!Array.isArray(data.medications) || !Array.isArray(data.allergies) || !Array.isArray(data.conditions)) {
        throw new Error("Unexpected response shape");
      }
      saveMedCard({ medications: data.medications, allergies: data.allergies, conditions: data.conditions });
      setResult(data);
    } catch {
      setClassifyError("Something went wrong checking your medications. Please try again.");
    } finally {
      setClassifying(false);
    }
  }, []);

  const runDemo = useCallback(() => classify(""), [classify]);

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-12">
      {/* Page header */}
      <header className="flex flex-col items-center gap-3 text-center animate-fade-up">
        <span
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "1px solid var(--care-tele-border)",
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="5" r="5" />
          </svg>
          Ongoing
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Your medications, organized
        </h1>
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Speak your medications, dosages, allergies, and conditions. CarePath screens for potential
          interactions and builds a shareable card.
        </p>
      </header>

      <div className="w-full max-w-2xl animate-fade-up stagger-1">
        <SafetyDisclaimer />
      </div>

      {result ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 animate-fade-up stagger-2">
          <MedCardResultView result={result} />
          <div className="flex flex-wrap justify-center gap-3 py-2">
            <DownloadMedCardButton />
            <button
              onClick={handleReset}
              style={{
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
              className="rounded-full px-6 py-3 text-sm font-medium transition-all duration-[var(--duration-normal)] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2"
            >
              Start New MedCard
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full max-w-2xl flex flex-col gap-6 animate-fade-up stagger-2">
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xs)",
                borderRadius: "var(--radius-xl)",
              }}
              className="p-5 flex flex-col items-start gap-3"
            >
              <div className="flex w-full items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--text-subtle)" }}>
                  Import records
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs transition-opacity duration-[var(--duration-fast)] hover:opacity-70 focus-visible:outline-2"
                  style={{ color: "var(--text-subtle)" }}
                  aria-label="Clear saved MedCard data and start over"
                >
                  Clear saved data
                </button>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Connect your Epic MyChart to pre-fill your medications, allergies, and conditions.
              </p>
              <ConnectHealthRecordsButton />
            </div>

            <VoiceConversationPanel
              mode="medcard"
              onConsultationEnd={classify}
              classifying={classifying}
              demoSlot={
                <div className="flex flex-col items-center gap-4">
                  <span
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-subtle)",
                      border: "1px solid var(--border)",
                    }}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                  >
                    Demo mode
                  </span>
                  <button
                    onClick={runDemo}
                    disabled={classifying}
                    style={{
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-primary)",
                    }}
                    className="rounded-full px-6 py-3 font-medium text-sm transition-all duration-[var(--duration-normal)] hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    Run Demo MedCard
                  </button>
                </div>
              }
            />
          </div>

          {/* Scan divider + PillBottleScanner */}
          <div className="w-full max-w-2xl animate-fade-up stagger-3">
            <div className="mb-4 flex items-center gap-4" aria-hidden="true">
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-subtle)" }}>
                or scan a pill bottle
              </span>
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            </div>
            <PillBottleScanner />
          </div>
        </>
      )}

      {classifyError && (
        <div
          role="alert"
          style={{
            background: "var(--care-er-bg)",
            border: "1px solid var(--care-er-border)",
            borderRadius: "var(--radius-lg)",
          }}
          className="flex w-full max-w-md flex-col items-center gap-3 p-4 text-center"
        >
          <p className="text-sm font-medium" style={{ color: "var(--care-er-text)" }}>
            {classifyError}
          </p>
          <button
            onClick={() => setClassifyError(null)}
            style={{
              border: "1px solid var(--care-er-border)",
              color: "var(--care-er-text)",
              borderRadius: "var(--radius-xl)",
            }}
            className="px-5 py-2 text-xs font-semibold transition-all duration-[var(--duration-fast)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Dismiss
          </button>
        </div>
      )}

      {classifying && <LoadingOverlay message="Reviewing your medications…" />}
    </main>
  );
}
