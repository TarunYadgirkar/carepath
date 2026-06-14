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

  const handleReset = useCallback(() => {
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
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-12">
      <div className="animate-fade-up flex flex-col items-center gap-3 text-center">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            background: "var(--care-self-bg)",
            color: "var(--care-self-text)",
            border: "1px solid var(--care-self-border)",
          }}
        >
          Post-Visit
        </span>
        <h1
          className="font-display text-4xl leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Just left the doctor?
        </h1>
        <p className="max-w-md text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Just left an appointment? Describe what your doctor told you and get a plain-language
          summary, key facts, and next steps.
        </p>
      </div>

      <div className="animate-fade-up stagger-1">
        <SafetyDisclaimer />
      </div>

      {result ? (
        <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col gap-4">
          <DebriefCardView result={result} />
          <button
            type="button"
            onClick={handleReset}
            className="self-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95 min-h-[44px]"
            style={{
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              background: "var(--surface)",
            }}
          >
            Start New Debrief
          </button>
        </div>
      ) : (
        <div className="animate-fade-up stagger-2 w-full max-w-2xl">
          <VoiceConversationPanel
            mode="debrief"
            onConsultationEnd={classify}
            classifying={classifying}
            demoSlot={
              <div className="flex flex-col items-center gap-4">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-subtle)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Demo mode
                </span>
                <button
                  onClick={runDemo}
                  disabled={classifying}
                  className="rounded-full px-6 py-3 font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-contrast)",
                  }}
                >
                  Run Demo Debrief
                </button>
              </div>
            }
          />
        </div>
      )}

      {classifyError && (
        <div
          role="alert"
          className="flex max-w-md flex-col items-center gap-3 rounded-[var(--radius-xl)] p-5 text-center"
          style={{
            background: "var(--care-er-bg)",
            border: "1px solid var(--care-er-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--care-er-text)" }}>
            {classifyError}
          </p>
          <button
            onClick={() => setClassifyError(null)}
            className="rounded-full px-5 py-2 text-xs font-semibold transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            style={{
              border: "1px solid var(--care-er-border)",
              color: "var(--care-er-text)",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {classifying && <LoadingOverlay message="Putting together your debrief…" />}
    </main>
  );
}
