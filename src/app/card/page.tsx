"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CarePathResult } from "@/types/carepath";
import { clearCareResult, loadCareResult, saveCareResult } from "@/lib/care-result-storage";
import { saveMedCard } from "@/lib/medcard";
import { buildAggregateTranscript } from "@/lib/aggregate-context";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { CareCardView } from "@/components/care-card/CareCardView";
import { ShareCardButton } from "@/components/care-card/ShareCardButton";
import { DEMO_RESULT } from "@/mocks/demo-result";

export default function CarePage() {
  const [result, setResult] = useState<CarePathResult | null | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aggregateHint, setAggregateHint] = useState<string | null>(null);
  const [aggregateError, setAggregateError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadCareResult();
    queueMicrotask(() => {
      setResult(loaded);
      if (loaded) {
        saveMedCard({
          medications: loaded.medications,
          allergies: loaded.allergies,
          conditions: loaded.conditions,
        });
      }
    });
  }, []);

  const loadExample = () => {
    saveCareResult(DEMO_RESULT);
    saveMedCard({
      medications: DEMO_RESULT.medications,
      allergies: DEMO_RESULT.allergies,
      conditions: DEMO_RESULT.conditions,
    });
    setResult(DEMO_RESULT);
  };

  const generateFromSavedData = async () => {
    setAggregateHint(null);
    setAggregateError(null);

    const { transcript, hasAnyData } = buildAggregateTranscript();
    if (!hasAnyData) {
      setAggregateHint("No saved data yet — log symptoms, add medications, or import records first.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, mode: "triage" }),
      });
      if (!res.ok) {
        throw new Error("classify request failed");
      }
      const data = (await res.json()) as CarePathResult;
      saveCareResult(data);
      saveMedCard({
        medications: data.medications,
        allergies: data.allergies,
        conditions: data.conditions,
      });
      setResult(data);
    } catch {
      setAggregateError("Couldn't generate your card right now. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAndReset = () => {
    clearCareResult();
    setResult(null);
  };

  if (result === undefined) {
    return null;
  }

  if (result === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
        <div className="animate-fade-up flex flex-col items-center gap-4">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--accent)" }}
          >
            Care Card
          </p>
          <h1
            className="font-display text-4xl leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Your Care Card
          </h1>
          <p className="max-w-sm text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Generate a card from a conversation, or load an example to see what a completed Care Card looks like.
          </p>
        </div>

        <div className="animate-fade-up stagger-2 flex flex-col items-center gap-3 w-full max-w-xs">
          <Link
            href="/intake"
            className="inline-flex w-full min-h-[44px] items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
          >
            Generate your own
          </Link>

          <div
            className="flex items-center gap-3 w-full text-xs"
            style={{ color: "var(--text-subtle)" }}
          >
            <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span>or</span>
            <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <button
            onClick={loadExample}
            className="inline-flex w-full min-h-[44px] items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95"
            style={{
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              background: "var(--surface)",
            }}
          >
            Load example
          </button>

          <button
            onClick={generateFromSavedData}
            disabled={isGenerating}
            className="inline-flex w-full min-h-[44px] items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            style={{
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              background: "var(--surface)",
            }}
          >
            {isGenerating ? "Generating…" : "Generate from my saved data"}
          </button>

          {aggregateHint && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {aggregateHint}{" "}
              <Link
                href="/timeline"
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                Log symptoms
              </Link>{" "}
              or{" "}
              <Link
                href="/medcard"
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                add medications
              </Link>
              .
            </p>
          )}

          {aggregateError && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--care-er-ring)" }}>
              {aggregateError}
            </p>
          )}

          <p
            className="text-xs leading-relaxed pt-1"
            style={{ color: "var(--text-subtle)" }}
          >
            You can also start from{" "}
            <Link
              href="/debrief"
              className="underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              debrief
            </Link>
            ,{" "}
            <Link
              href="/medcard"
              className="underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              med card
            </Link>
            , or{" "}
            <Link
              href="/signal"
              className="underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              signal
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <CareCardView result={result} />

      <div className="flex flex-wrap justify-center gap-3 py-2">
        <ShareCardButton result={result} />
        <button
          onClick={clearAndReset}
          className="rounded-full px-6 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95 min-h-[44px]"
          style={{
            border: "1px solid var(--border-strong)",
            color: "var(--text-primary)",
            background: "var(--surface)",
          }}
        >
          Start over / clear
        </button>
      </div>

      <div className="flex justify-center py-4">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
