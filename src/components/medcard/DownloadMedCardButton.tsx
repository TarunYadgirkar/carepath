"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

export function DownloadMedCardButton() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const node = document.getElementById("medcard-export");
    if (!node) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(node, { backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = "carepath-medcard.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
    >
      {downloading ? "Preparing…" : "Download MedCard"}
    </button>
  );
}
