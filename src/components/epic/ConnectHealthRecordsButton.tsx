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
        className="inline-flex items-center gap-2 rounded-full border border-current px-5 py-2.5 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        <span aria-hidden="true">🩺</span>
        Import from Epic MyChart
      </button>
      {open && <ConnectHealthRecordsModal onClose={() => setOpen(false)} />}
    </>
  );
}
