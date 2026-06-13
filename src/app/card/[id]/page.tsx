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
    setResult(loadSharedCareResult(params.id));
    setShareUrl(window.location.href);
  }, [params.id]);

  if (result === undefined) {
    return null;
  }

  if (result === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Care Card not found</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          This link only works on the same device and browser where the Care Card was shared.
        </p>
        <Link href="/" className="rounded-full bg-foreground px-6 py-3 font-medium text-background">
          Go home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <CareCardView result={result} />

      <section className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Save or share this card</h2>
        {shareUrl && <QRCodeSVG value={shareUrl} size={140} />}
        <p className="max-w-sm text-xs text-zinc-500">
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
