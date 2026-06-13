"use client";

import { useCallback, useState } from "react";
import type { MedCardResult } from "@/types/carepath";
import { saveMedCard } from "@/lib/medcard";
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
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
        Ongoing · MedCard
      </span>
      <h1 className="text-2xl font-semibold">CarePath MedCard</h1>
      <p className="max-w-md text-center text-sm text-zinc-500">
        Speak your medications, dosages, allergies, and conditions. CarePath checks for interactions and builds a
        shareable card.
      </p>

      <SafetyDisclaimer />

      {result ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <MedCardResultView result={result} />
          <div className="flex flex-wrap justify-center gap-3 py-2">
            <DownloadMedCardButton />
            <button
              onClick={() => setResult(null)}
              className="rounded-full border border-current px-6 py-3 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              Start New MedCard
            </button>
          </div>
        </div>
      ) : (
        <>
          <ConnectHealthRecordsButton />
          <VoiceConversationPanel
            mode="medcard"
            onConsultationEnd={classify}
            classifying={classifying}
            demoSlot={
              <div className="flex flex-col items-center gap-4">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900">
                  Demo mode
                </span>
                <button
                  onClick={runDemo}
                  disabled={classifying}
                  className="rounded-full border border-current px-6 py-3 font-medium transition-transform duration-150 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  Run Demo MedCard
                </button>
              </div>
            }
          />

          <div className="w-full max-w-md">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                or scan a pill bottle
              </span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
            </div>
            <PillBottleScanner />
          </div>
        </>
      )}

      {classifyError && (
        <div role="alert" className="flex max-w-md flex-col items-center gap-3 rounded-2xl bg-red-50 p-4 text-center ring-1 ring-red-200 dark:bg-red-950/30 dark:ring-red-900">
          <p className="text-sm text-red-900 dark:text-red-200">{classifyError}</p>
          <button
            onClick={() => setClassifyError(null)}
            className="rounded-full border border-red-400 px-5 py-2 text-xs font-medium text-red-700 transition-transform duration-150 hover:scale-105 active:scale-95 dark:border-red-700 dark:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {classifying && <LoadingOverlay message="Checking your medications…" />}
    </main>
  );
}
