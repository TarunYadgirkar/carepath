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
      style={{
        background: "var(--accent)",
        color: "var(--accent-contrast)",
        borderRadius: "var(--radius-2xl)",
        boxShadow: "var(--shadow-sm)",
      }}
      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-[var(--duration-normal)] hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2"
    >
      {downloading ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          Preparing…
        </>
      ) : (
        <>
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7.5 1v9m0 0L4.5 7M7.5 10l3-3M2 13h11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download MedCard
        </>
      )}
    </button>
  );
}
