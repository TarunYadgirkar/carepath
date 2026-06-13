"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_TRANSCRIPT } from "@/mocks/demo-transcript";
import { saveCareResult } from "@/lib/care-result-storage";
import { syntheticPricing, DEFAULT_PLAN_KEY } from "@/data/synthetic-pricing";
import { InsurancePlanSelector } from "@/components/InsurancePlanSelector";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { VoiceConversationPanel } from "@/components/voice/VoiceConversationPanel";

export default function IntakePage() {
  const router = useRouter();
  const [classifying, setClassifying] = useState(false);
  const [demoTranscript, setDemoTranscript] = useState<string | null>(null);
  const [insurancePlanKey, setInsurancePlanKey] = useState(DEFAULT_PLAN_KEY);
  const [classifyError, setClassifyError] = useState<string | null>(null);

  const classify = useCallback(
    async (transcript: string) => {
      setClassifying(true);
      setClassifyError(null);
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, insurancePlan: insurancePlanKey }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        saveCareResult(data);
        router.push("/card");
      } catch {
        setClassifyError("Something went wrong analyzing your conversation. Please try again.");
      } finally {
        setClassifying(false);
      }
    },
    [router, insurancePlanKey]
  );

  const runDemo = useCallback(async () => {
    setDemoTranscript(null);
    await new Promise((r) => setTimeout(r, 1000));
    setDemoTranscript(DEMO_TRANSCRIPT);
    await classify(DEMO_TRANSCRIPT);
  }, [classify]);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        Pre-Visit · Triage
      </span>
      <h1 className="text-2xl font-semibold">CarePath Intake</h1>

      <SafetyDisclaimer />

      <VoiceConversationPanel
        mode="triage"
        onConsultationEnd={classify}
        insurancePlanName={syntheticPricing.plans[insurancePlanKey]?.name}
        classifying={classifying}
        insuranceSelector={
          <InsurancePlanSelector value={insurancePlanKey} onChange={setInsurancePlanKey} disabled={classifying} />
        }
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
              Run Demo Conversation (Maya Patel)
            </button>

            {demoTranscript && (
              <pre className="max-w-xl whitespace-pre-wrap rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
                {demoTranscript}
              </pre>
            )}
          </div>
        }
      />

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

      {classifying && <LoadingOverlay message="Generating your Care Card…" />}
    </main>
  );
}
