"use client";

import { useCallback, useState } from "react";
import type { DebriefResult } from "@/types/carepath";
import { saveMedCard } from "@/lib/medcard";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { VoiceConversationPanel } from "@/components/voice/VoiceConversationPanel";
import { DebriefCardView } from "@/components/debrief/DebriefCardView";

export default function DebriefPage() {
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<DebriefResult | null>(null);
  const [classifyError, setClassifyError] = useState<string | null>(null);

  const classify = useCallback(async (transcript: string) => {
    setClassifying(true);
    setClassifyError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, mode: "debrief" }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: DebriefResult = await res.json();
      if (!Array.isArray(data.medications) || !Array.isArray(data.allergies) || !Array.isArray(data.conditions)) {
        throw new Error("Unexpected response shape");
      }
      saveMedCard({ medications: data.medications, allergies: data.allergies, conditions: data.conditions });
      setResult(data);
    } catch {
      setClassifyError("Something went wrong analyzing your conversation. Please try again.");
    } finally {
      setClassifying(false);
    }
  }, []);

  const runDemo = useCallback(() => classify(""), [classify]);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Post-Visit · Debrief
      </span>
      <h1 className="text-2xl font-semibold">CarePath Debrief</h1>
      <p className="max-w-md text-center text-sm text-zinc-500">
        Just left an appointment? Describe what your doctor told you and get a plain-language explanation, key
        facts, and next steps.
      </p>

      <SafetyDisclaimer />

      {result ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <DebriefCardView result={result} />
          <button
            onClick={() => setResult(null)}
            className="self-center rounded-full border border-current px-6 py-3 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            Start New Debrief
          </button>
        </div>
      ) : (
        <VoiceConversationPanel
          mode="debrief"
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
                Run Demo Debrief
              </button>
            </div>
          }
        />
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

      {classifying && <LoadingOverlay message="Putting together your debrief…" />}
    </main>
  );
}
