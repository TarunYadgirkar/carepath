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

export default function MedCardPage() {
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<MedCardResult | null>(null);

  const classify = useCallback(async (transcript: string) => {
    setClassifying(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, mode: "medcard" }),
      });
      const data: MedCardResult = await res.json();
      saveMedCard({ medications: data.medications, allergies: data.allergies, conditions: data.conditions });
      setResult(data);
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
        </>
      )}

      {classifying && <LoadingOverlay message="Checking your medications…" />}
    </main>
  );
}
