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
    setResult(loaded);
    if (loaded) {
      saveMedCard({
        medications: loaded.medications,
        allergies: loaded.allergies,
        conditions: loaded.conditions,
      });
    }
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
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">No Care Card yet</h1>
        <p className="text-sm text-zinc-500">Start an intake conversation to generate one.</p>
        <Link
          href="/intake"
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
        >
          Go to Intake
        </Link>
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
          className="rounded-full border border-current px-6 py-3 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          Start New Conversation
        </button>
      </div>

      <div className="flex justify-center py-4">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
