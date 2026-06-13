"use client";

import { useState } from "react";
import { ConnectHealthRecordsModal } from "./ConnectHealthRecordsModal";

export function ConnectHealthRecordsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          border: "1px solid var(--border-strong)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "var(--shadow-xs)",
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all duration-[var(--duration-normal)] hover:scale-[1.02] hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-[0.98] focus-visible:outline-2"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="1"
            width="12"
            height="14"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <path
            d="M5 5h6M5 8h6M5 11h3"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <circle cx="13" cy="13" r="2.5" fill="var(--accent)" />
          <path
            d="M13 12v2M12 13h2"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
        Import from Epic MyChart
      </button>
      {open && <ConnectHealthRecordsModal onClose={() => setOpen(false)} />}
    </>
  );
}
