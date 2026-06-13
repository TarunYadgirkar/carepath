"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { CarePathResult } from "@/types/carepath";
import { loadSharedCareResult } from "@/lib/care-result-storage";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import { CareCardView } from "@/components/care-card/CareCardView";

export default function SharedCarePage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<CarePathResult | null | undefined>(undefined);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const loaded = loadSharedCareResult(params.id);
    const url = window.location.href;
    queueMicrotask(() => {
      setResult(loaded);
      setShareUrl(url);
    });
  }, [params.id]);

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
            Shared Care Card
          </p>
          <h1
            className="font-display text-4xl leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Care Card not found
          </h1>
          <p className="max-w-sm text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            This link only works on the same device and browser where the Care Card was shared.
          </p>
        </div>
        <div className="animate-fade-up stagger-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full px-8 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-105 active:scale-95"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
          >
            Go home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      {/* SafetyDisclaimer above the fold as required */}
      <div className="animate-fade-up flex justify-center pb-2">
        <SafetyDisclaimer />
      </div>

      <CareCardView result={result} />

      <section
        className="animate-fade-up stagger-3 flex flex-col items-center gap-4 rounded-[var(--radius-xl)] p-6 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Save or share this card
        </h2>
        {shareUrl && (
          <div
            className="rounded-[var(--radius-lg)] p-3"
            style={{ background: "var(--surface-2)" }}
          >
            <QRCodeSVG value={shareUrl} size={140} />
          </div>
        )}
        <p className="max-w-sm text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          This link only works on this device and browser. Save it or screenshot this page —
          don&apos;t scan the QR code on a different device.
        </p>
      </section>

      <div className="flex justify-center py-4">
        <SafetyDisclaimer />
      </div>
    </main>
  );
}
