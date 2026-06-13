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
    <section
      aria-labelledby="check-in-script-heading"
      className="rounded-[var(--radius-xl)] ring-1"
      style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="flex items-center justify-between gap-4 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--accent)" }}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h2
            id="check-in-script-heading"
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-subtle)" }}
          >
            What to say at check-in
          </h2>
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? "Script copied to clipboard" : "Copy check-in script to clipboard"}
          className="flex min-h-[36px] min-w-[60px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors"
          style={{
            background: copied ? "var(--accent-soft)" : "var(--surface-2)",
            color: copied ? "var(--accent)" : "var(--text-muted)",
            borderColor: copied ? "var(--accent)" : "var(--border)",
          }}
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </span>
          ) : (
            "Copy"
          )}
        </button>
      </div>

      <div className="p-5">
        <blockquote
          className="whitespace-pre-wrap rounded-[var(--radius-md)] p-4 text-[0.9375rem] leading-relaxed"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-primary)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          {script}
        </blockquote>
        <p className="mt-3 text-xs" style={{ color: "var(--text-subtle)" }}>
          Read this to the receptionist or nurse when you arrive.
        </p>
      </div>
    </section>
  );
}
