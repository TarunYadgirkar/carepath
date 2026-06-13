"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CarePathResult } from "@/types/carepath";
import { clearCareResult, loadCareResult } from "@/lib/care-result-storage";
import { saveMedCard } from "@/lib/medcard";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { CareCardView } from "@/components/care-card/CareCardView";
import { ShareCardButton } from "@/components/care-card/ShareCardButton";

export default function CarePage() {
  const router = useRouter();
  const [result, setResult] = useState<CarePathResult | null | undefined>(undefined);

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

  const startNewConversation = () => {
    clearCareResult();
    router.push("/intake");
  };

  if (result === undefined) {
    return null;
  }

  if (result === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
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
            No Care Card yet
          </h1>
          <p className="max-w-sm text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Describe your symptoms in an intake conversation and CarePath will build your Care Card.
          </p>
        </div>
        <div className="animate-fade-up stagger-2">
          <Link
            href="/intake"
            className="inline-flex min-h-[44px] items-center rounded-full px-8 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
          >
            Start intake
          </Link>
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
          onClick={startNewConversation}
          className="rounded-full px-6 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95 min-h-[44px]"
          style={{
            border: "1px solid var(--border-strong)",
            color: "var(--text-primary)",
            background: "var(--surface)",
          }}
        >
          Start new intake
        </button>
      </div>

      <div className="flex justify-center py-4">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
