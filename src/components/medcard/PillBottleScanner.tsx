"use client";

import { useCallback, useRef, useState } from "react";
import { getMedCard, saveMedCard } from "@/lib/medcard";

type ScanState = "idle" | "loading" | "result" | "error";

type ScanResult = {
  medicationName: string;
  dosage: string;
  frequency: string;
  confidence: "low" | "medium" | "high";
};

type ConfirmFields = {
  medicationName: string;
  dosage: string;
  frequency: string;
};

const CONFIDENCE_STYLES: Record<ScanResult["confidence"], string> = {
  low: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  medium:
    "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  high: "bg-teal-50 text-teal-800 ring-1 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900",
};

const CONFIDENCE_LABELS: Record<ScanResult["confidence"], string> = {
  low: "Low confidence — please review carefully",
  medium: "Medium confidence — verify before saving",
  high: "High confidence",
};

export function PillBottleScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [confirm, setConfirm] = useState<ConfirmFields>({
    medicationName: "",
    dosage: "",
    frequency: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setScanState("loading");
      setScanResult(null);
      setErrorMsg(null);
      setSaved(false);

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);

        try {
          const res = await fetch("/api/scan-label", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          });

          const data: { medicationName?: string; dosage?: string; frequency?: string; confidence?: string; error?: string } =
            await res.json();

          if (!res.ok || data.error) {
            throw new Error(data.error ?? `Server error ${res.status}`);
          }

          const result: ScanResult = {
            medicationName: data.medicationName ?? "",
            dosage: data.dosage ?? "",
            frequency: data.frequency ?? "",
            confidence: (data.confidence as ScanResult["confidence"]) ?? "low",
          };

          setScanResult(result);
          setConfirm({
            medicationName: result.medicationName,
            dosage: result.dosage,
            frequency: result.frequency,
          });
          setScanState("result");
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Scan failed — please try again.");
          setScanState("error");
        }
      };

      reader.onerror = () => {
        setErrorMsg("Could not read the image file.");
        setScanState("error");
      };

      reader.readAsDataURL(file);
    },
    []
  );

  const handleConfirmChange = useCallback(
    (field: keyof ConfirmFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirm((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const handleAddToMedCard = useCallback(() => {
    const name = confirm.medicationName.trim();
    const dosage = confirm.dosage.trim();
    const frequency = confirm.frequency.trim();
    if (!name) return;

    const parts = [name, dosage].filter(Boolean).join(" ");
    const formatted = frequency ? `${parts} — ${frequency}` : parts;

    const existing = getMedCard();
    saveMedCard({
      medications: [...(existing?.medications ?? []), formatted],
      allergies: existing?.allergies ?? [],
      conditions: existing?.conditions ?? [],
    });

    setSaved(true);
  }, [confirm]);

  const handleReset = useCallback(() => {
    setScanState("idle");
    setPreview(null);
    setScanResult(null);
    setConfirm({ medicationName: "", dosage: "", frequency: "" });
    setErrorMsg(null);
    setSaved(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Scan Pill Bottle
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Point your camera at a pill bottle label — CarePath will extract the medication name,
          dosage, and instructions.
        </p>
      </header>

      {scanState === "idle" && (
        <div className="flex flex-col items-center gap-3">
          <label
            htmlFor="pill-bottle-input"
            className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-8 py-8 transition-colors duration-150 hover:border-[var(--accent)] hover:bg-teal-50/40 dark:border-zinc-700 dark:hover:border-[var(--accent)] dark:hover:bg-teal-950/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-8 w-8 text-zinc-400 transition-colors duration-150 group-hover:text-[var(--accent)]"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Take photo or choose image
            </span>
            <span className="text-xs text-zinc-400">Camera opens on mobile</span>
          </label>
          <input
            ref={inputRef}
            id="pill-bottle-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      )}

      {scanState === "loading" && (
        <div className="flex flex-col items-center gap-4 py-6">
          {preview && (
            // next/image can't optimize a client-side base64 data URL
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Pill bottle being scanned"
              className="h-32 w-32 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
            />
          )}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-[var(--accent)]"
            />
            Reading label…
          </div>
        </div>
      )}

      {scanState === "result" && scanResult && (
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            {preview && (
              // next/image can't optimize a client-side base64 data URL
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Scanned pill bottle"
                className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
              />
            )}
            <div className="flex flex-col gap-1.5">
              <span
                className={`self-start rounded-full px-3 py-1 text-xs font-medium ${CONFIDENCE_STYLES[scanResult.confidence]}`}
              >
                {CONFIDENCE_LABELS[scanResult.confidence]}
              </span>
              <p className="text-xs text-zinc-500">
                Correct any errors before saving — vision models aren&apos;t perfect on small print.
              </p>
            </div>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Confirm extracted details
            </legend>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Medication name
              </span>
              <input
                type="text"
                value={confirm.medicationName}
                onChange={handleConfirmChange("medicationName")}
                placeholder="e.g. Lisinopril"
                className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-zinc-700"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Dosage</span>
              <input
                type="text"
                value={confirm.dosage}
                onChange={handleConfirmChange("dosage")}
                placeholder="e.g. 10mg"
                className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-zinc-700"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Frequency / instructions
              </span>
              <input
                type="text"
                value={confirm.frequency}
                onChange={handleConfirmChange("frequency")}
                placeholder="e.g. once daily"
                className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-zinc-700"
              />
            </label>
          </fieldset>

          {saved ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 ring-1 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added to your MedCard
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-current px-5 py-2.5 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                Scan another bottle
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddToMedCard}
                disabled={!confirm.medicationName.trim()}
                className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-transform duration-150 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                Add to MedCard
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-current px-5 py-2.5 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {scanState === "error" && (
        <div className="flex flex-col gap-3">
          <div
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900"
          >
            {errorMsg ?? "Scan failed — please try again."}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="self-start rounded-full border border-current px-5 py-2.5 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            Try again
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-400">
        <strong className="font-medium text-zinc-500">Privacy:</strong> Your photo is sent to
        OpenAI for one-time label extraction and is not stored — not on CarePath servers, not in
        your browser. Only the extracted text is saved to your local MedCard.
      </p>
    </section>
  );
}
