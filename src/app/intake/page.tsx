"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useGrokVoice } from "@/hooks/useGrokVoice";
import { DEMO_TRANSCRIPT } from "@/mocks/demo-transcript";
import { saveCareResult } from "@/lib/care-result-storage";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";

// Flip to false once live Grok Voice is confirmed working end-to-end.
const DEMO_MODE = true;

export default function IntakePage() {
  const router = useRouter();
  const [classifying, setClassifying] = useState(false);
  const [demoTranscript, setDemoTranscript] = useState<string | null>(null);

  const classify = useCallback(
    async (transcript: string) => {
      setClassifying(true);
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });
        const data = await res.json();
        saveCareResult(data);
        router.push("/card");
      } finally {
        setClassifying(false);
      }
    },
    [router]
  );

  const { status, error, patientTranscript, aiTranscript, start, stop } = useGrokVoice(
    (summary) => classify(summary || patientTranscript)
  );

  const runDemo = useCallback(async () => {
    setDemoTranscript(null);
    await new Promise((r) => setTimeout(r, 1000));
    setDemoTranscript(DEMO_TRANSCRIPT);
    await classify(DEMO_TRANSCRIPT);
  }, [classify]);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">CarePath Intake</h1>

      <SafetyDisclaimer />

      {DEMO_MODE ? (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={runDemo}
            disabled={classifying}
            className="rounded-full bg-foreground px-6 py-3 text-background font-medium disabled:opacity-50"
          >
            Run Demo Conversation (Maya Patel)
          </button>

          {demoTranscript && (
            <pre className="max-w-xl whitespace-pre-wrap rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
              {demoTranscript}
            </pre>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {status === "idle" || status === "ended" || status === "error" ? (
            <button
              onClick={start}
              className="rounded-full bg-foreground px-6 py-3 text-background font-medium"
            >
              Start Voice Conversation
            </button>
          ) : (
            <button
              onClick={stop}
              className="rounded-full border border-current px-6 py-3 font-medium"
            >
              End Conversation
            </button>
          )}

          <p className="text-sm text-zinc-500">Status: {status}</p>
          {error && <p className="text-sm text-red-500">{error}</p>}

          {(patientTranscript || aiTranscript) && (
            <div className="grid max-w-xl gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
                <h2 className="mb-2 font-medium">You</h2>
                <p className="whitespace-pre-wrap">{patientTranscript}</p>
              </div>
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
                <h2 className="mb-2 font-medium">CarePath</h2>
                <p className="whitespace-pre-wrap">{aiTranscript}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {classifying && <p className="text-sm text-zinc-500">Generating Care Card…</p>}
    </main>
  );
}
