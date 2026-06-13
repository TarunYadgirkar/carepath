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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-8 px-6 py-12 animate-fade-up">
      {/* Page header */}
      <div className="flex flex-col items-center gap-3 text-center stagger-1 animate-fade-up">
        <span
          className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            background: "var(--care-primary-bg)",
            color: "var(--care-primary-text)",
            border: "1px solid var(--care-primary-border)",
          }}
        >
          Pre-Visit · Triage
        </span>
        <h1
          className="font-display text-3xl font-semibold leading-tight tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          CarePath Intake
        </h1>
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Describe what&apos;s going on. CarePath will suggest your next care step.
        </p>
      </div>

      <div className="stagger-2 animate-fade-up w-full max-w-xl">
        <SafetyDisclaimer />
      </div>

      <div className="stagger-3 animate-fade-up w-full max-w-xl">
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
              <span
                className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
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
                aria-label="Run demo conversation with Maya Patel"
                className="min-h-[44px] rounded-full px-6 py-3 text-sm font-medium ring-1 transition-all duration-150 hover:opacity-80 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-strong)",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                Run Demo Conversation (Maya Patel)
              </button>

              {demoTranscript && (
                <pre
                  className="w-full max-w-xl whitespace-pre-wrap rounded-xl p-4 text-xs leading-relaxed"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {demoTranscript}
                </pre>
              )}
            </div>
          }
        />
      </div>

      {classifyError && (
        <div
          role="alert"
          className="stagger-4 animate-fade-up flex w-full max-w-md flex-col items-center gap-3 rounded-xl p-4 text-center ring-1"
          style={{
            background: "var(--care-er-bg)",
            borderColor: "var(--care-er-border)",
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--care-er-text)" }}>
            {classifyError}
          </p>
          <button
            onClick={() => setClassifyError(null)}
            className="min-h-[36px] rounded-full px-5 py-1.5 text-xs font-medium ring-1 transition-all duration-150 hover:opacity-80 active:scale-95"
            style={{
              color: "var(--care-er-text)",
              borderColor: "var(--care-er-border)",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {classifying && <LoadingOverlay message="Generating your Care Card…" />}
    </main>
  );
}
