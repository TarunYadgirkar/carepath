"use client";

import { useState } from "react";

type Community = {
  name: string;
  title: string;
  subscribers: number | null;
  description: string;
  why: string;
  url: string;
};

type CommunitiesResponse = {
  communities: Community[];
  disclaimer: string;
};

type Props = {
  summary: string;
  signals?: string[];
};

type Status = "idle" | "loading" | "done" | "error";

function formatMembers(count: number | null): string | null {
  if (count === null || count <= 0) return null;
  if (count < 1000) return `${count} members`;
  if (count < 1_000_000) {
    const k = count / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k members`;
  }
  const m = count / 1_000_000;
  return `${m >= 100 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M members`;
}

export function CommunitySuggestions({ summary, signals }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [disclaimer, setDisclaimer] = useState("");

  const handleFind = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, signals }),
      });
      const data: CommunitiesResponse = await res.json();
      setCommunities(Array.isArray(data.communities) ? data.communities : []);
      setDisclaimer(typeof data.disclaimer === "string" ? data.disclaimer : "");
      setStatus("done");
    } catch {
      setCommunities([]);
      setDisclaimer("");
      setStatus("error");
    }
  };

  return (
    <section
      aria-labelledby="communities-heading"
      className="rounded-[var(--radius-xl)] ring-1"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="p-5">
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h2
            id="communities-heading"
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-subtle)" }}
          >
            Communities discussing similar symptoms
          </h2>
        </div>

        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Optionally find peer-support communities where others discuss similar
          experiences. We&apos;ll only look this up when you ask.
        </p>

        {status === "idle" && (
          <button
            onClick={handleFind}
            aria-label="Find communities discussing similar symptoms"
            className="mt-4 flex min-h-[44px] items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ring-1 transition-all"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              borderColor: "var(--border)",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-expo)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Find related communities
          </button>
        )}

        {status === "loading" && (
          <div
            className="mt-4 flex min-h-[44px] items-center gap-2.5 text-sm"
            style={{ color: "var(--text-muted)" }}
            role="status"
            aria-live="polite"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Searching communities&hellip;
          </div>
        )}

        {(status === "done" || status === "error") && communities.length === 0 && (
          <div
            className="mt-4 rounded-[var(--radius-md)] p-4 text-sm leading-relaxed"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-muted)",
            }}
            role="status"
            aria-live="polite"
          >
            No matching communities found &mdash; that&apos;s okay. Your provider and
            the steps above remain your best next move.
          </div>
        )}

        {status === "done" && communities.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {disclaimer && (
              <div
                role="note"
                aria-label="Important disclaimer about online communities"
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] p-3.5 ring-1"
                style={{
                  background: "var(--care-urgent-bg)",
                  color: "var(--care-urgent-text)",
                  borderColor: "var(--care-urgent-border)",
                }}
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-[1px] shrink-0"
                  style={{ color: "var(--care-urgent-ring)" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[0.8125rem] font-medium leading-relaxed">{disclaimer}</p>
              </div>
            )}

            <ul className="flex flex-col gap-3" role="list">
              {communities.map((community) => {
                const members = formatMembers(community.subscribers);
                return (
                  <li
                    key={community.name}
                    className="rounded-[var(--radius-md)] p-4 ring-1"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        r/{community.name}
                      </span>
                      {members && (
                        <span
                          className="shrink-0 text-xs font-medium"
                          style={{ color: "var(--text-subtle)" }}
                        >
                          {members}
                        </span>
                      )}
                    </div>

                    {community.title && (
                      <p
                        className="mt-0.5 text-xs font-medium"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {community.title}
                      </p>
                    )}

                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {community.why}
                    </p>

                    {community.description && (
                      <p
                        className="mt-1.5 text-xs leading-relaxed"
                        style={{ color: "var(--text-subtle)" }}
                      >
                        {community.description}
                      </p>
                    )}

                    <a
                      href={community.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open r/${community.name} on Reddit in a new tab`}
                      className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition-colors"
                      style={{
                        background: "var(--surface)",
                        color: "var(--accent)",
                        borderColor: "var(--border)",
                        transitionDuration: "var(--duration-fast)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      Open on Reddit
                      <svg
                        aria-hidden="true"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
