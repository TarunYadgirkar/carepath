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

const CONFIDENCE_META: Record<
  ScanResult["confidence"],
  { bg: string; text: string; border: string; icon: string; label: string }
> = {
  low: {
    bg: "var(--care-er-bg)",
    text: "var(--care-er-text)",
    border: "var(--care-er-border)",
    icon: "⚠",
    label: "Low confidence — please review carefully",
  },
  medium: {
    bg: "var(--care-urgent-bg)",
    text: "var(--care-urgent-text)",
    border: "var(--care-urgent-border)",
    icon: "▲",
    label: "Medium confidence — verify before saving",
  },
  high: {
    bg: "var(--care-tele-bg)",
    text: "var(--care-tele-text)",
    border: "var(--care-tele-border)",
    icon: "✓",
    label: "High confidence",
  },
};

const INPUT_CLASS =
  "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-[var(--duration-fast)]";

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

          const data: {
            medicationName?: string;
            dosage?: string;
            frequency?: string;
            confidence?: string;
            error?: string;
          } = await res.json();

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
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-sm)",
      }}
      className="flex flex-col gap-5 p-6"
    >
      <header>
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Scan Pill Bottle
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Point your camera at a pill bottle label — CarePath extracts the medication name,
          dosage, and instructions for you.
        </p>
      </header>

      {/* ── IDLE ─────────────────────────────────────────────────────────────── */}
      {scanState === "idle" && (
        <div className="flex flex-col items-center gap-3">
          <label
            htmlFor="pill-bottle-input"
            className="group flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-8 py-10 transition-all duration-[var(--duration-normal)]"
            style={{
              borderColor: "var(--border-strong)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLLabelElement).style.background = "var(--accent-soft)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border-strong)";
              (e.currentTarget as HTMLLabelElement).style.background = "transparent";
            }}
          >
            {/* Camera icon */}
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-[var(--duration-normal)]"
              style={{ background: "var(--surface-2)" }}
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
                className="h-6 w-6 transition-colors duration-[var(--duration-normal)]"
                style={{ color: "var(--accent)" }}
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Take photo or choose image
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-subtle)" }}>
                Camera opens on mobile · JPEG, PNG, HEIC supported
              </p>
            </div>
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

      {/* ── LOADING ───────────────────────────────────────────────────────────── */}
      {scanState === "loading" && (
        <div className="flex flex-col items-center gap-5 py-6">
          {preview && (
            // next/image can't optimize a client-side base64 data URL
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Pill bottle being scanned"
              className="h-32 w-32 rounded-xl object-cover"
              style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            />
          )}
          <div className="flex flex-col items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--border-strong)", borderTopColor: "var(--accent)" }}
            />
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Reading label…
            </p>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
              This usually takes a few seconds
            </p>
          </div>
        </div>
      )}

      {/* ── RESULT ───────────────────────────────────────────────────────────── */}
      {scanState === "result" && scanResult && (
        <div className="flex flex-col gap-5 animate-fade-up">
          {/* Preview + confidence */}
          <div className="flex items-start gap-4">
            {preview && (
              // next/image can't optimize a client-side base64 data URL
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Scanned pill bottle"
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
                style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}
              />
            )}
            <div className="flex flex-col gap-2">
              {(() => {
                const meta = CONFIDENCE_META[scanResult.confidence];
                return (
                  <span
                    className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: meta.bg,
                      color: meta.text,
                      border: `1px solid ${meta.border}`,
                    }}
                    aria-label={meta.label}
                  >
                    <span aria-hidden="true">{meta.icon}</span>
                    {meta.label}
                  </span>
                );
              })()}
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Review and correct any errors before saving — vision models aren&apos;t perfect on
                small print.
              </p>
            </div>
          </div>

          {/* Editable confirm form */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--text-subtle)" }}>
              Confirm extracted details
            </legend>

            {(
              [
                { field: "medicationName" as const, label: "Medication name", placeholder: "e.g. Lisinopril" },
                { field: "dosage" as const, label: "Dosage", placeholder: "e.g. 10mg" },
                { field: "frequency" as const, label: "Frequency / instructions", placeholder: "e.g. once daily" },
              ] as const
            ).map(({ field, label, placeholder }) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {label}
                </span>
                <input
                  type="text"
                  value={confirm[field]}
                  onChange={handleConfirmChange(field)}
                  placeholder={placeholder}
                  className={INPUT_CLASS}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-md)",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "var(--accent)";
                    (e.currentTarget as HTMLInputElement).style.outline = "2px solid var(--accent)";
                    (e.currentTarget as HTMLInputElement).style.outlineOffset = "2px";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLInputElement).style.outline = "none";
                  }}
                />
              </label>
            ))}
          </fieldset>

          {saved ? (
            <div className="flex flex-col gap-3">
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  background: "var(--care-tele-bg)",
                  color: "var(--care-tele-text)",
                  border: "1px solid var(--care-tele-border)",
                }}
                role="status"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
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
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-2xl)",
                }}
                className="self-start px-5 py-2.5 text-sm font-medium transition-all duration-[var(--duration-fast)] hover:scale-[1.02] active:scale-[0.98]"
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
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-contrast)",
                  borderRadius: "var(--radius-2xl)",
                  boxShadow: "var(--shadow-sm)",
                }}
                className="px-6 py-2.5 text-sm font-semibold transition-all duration-[var(--duration-fast)] hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                Add to MedCard
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-muted)",
                  borderRadius: "var(--radius-2xl)",
                }}
                className="px-5 py-2.5 text-sm font-medium transition-all duration-[var(--duration-fast)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ERROR ─────────────────────────────────────────────────────────────── */}
      {scanState === "error" && (
        <div className="flex flex-col gap-3 animate-fade-up">
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "var(--care-er-bg)",
              color: "var(--care-er-text)",
              border: "1px solid var(--care-er-border)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            >
              <path
                d="M8 1.5L14.5 13H1.5L8 1.5Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
            </svg>
            <span>{errorMsg ?? "Scan failed — please try again."}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            style={{
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-2xl)",
            }}
            className="self-start px-5 py-2.5 text-sm font-medium transition-all duration-[var(--duration-fast)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
      )}

      {/* Privacy note — always visible */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-subtle)" }}>
        <strong className="font-medium" style={{ color: "var(--text-muted)" }}>Privacy:</strong>{" "}
        Your photo is sent to OpenAI for one-time label extraction and is not stored — not on
        CarePath servers, not in your browser. Only the extracted text is saved locally.
      </p>
    </section>
  );
}
