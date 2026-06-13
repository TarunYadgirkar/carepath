"use client";

import { useState } from "react";

type Props = {
  script: string;
};

export function CheckInScript({ script }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          What to say at check-in
        </h2>
        <button
          onClick={handleCopy}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium dark:border-zinc-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed dark:bg-zinc-900">
        {script}
      </p>
    </section>
  );
}
