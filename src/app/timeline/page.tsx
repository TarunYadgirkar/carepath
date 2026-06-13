"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";
import {
  getSymptomLog,
  addSymptomEntry,
  removeSymptomEntry,
  type SymptomEntry,
  type SymptomLog,
} from "@/lib/symptom-log";

const EMPTY_LOG: SymptomLog = { entries: [] };

// useSyncExternalStore requires a referentially stable snapshot — return the
// same object until the underlying data actually changes, else React loops.
let snapshotSerialized: string | null = null;
let snapshotValue: SymptomLog = EMPTY_LOG;

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getSnapshot(): SymptomLog {
  const current = getSymptomLog();
  const serialized = JSON.stringify(current);
  if (serialized !== snapshotSerialized) {
    snapshotSerialized = serialized;
    snapshotValue = current;
  }
  return snapshotValue;
}

function getServerSnapshot(): SymptomLog {
  return EMPTY_LOG;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Severity ramp — maps 1–10 to CSS token pairs (bg / text / border)
type SeverityStyle = { bg: string; text: string; border: string };

function severityStyle(n: number): SeverityStyle {
  const level = Math.max(1, Math.min(10, Math.round(n)));
  if (level <= 2)
    return { bg: "var(--care-self-bg)", text: "var(--care-self-text)", border: "var(--care-self-border)" };
  if (level <= 4)
    return { bg: "var(--care-tele-bg)", text: "var(--care-tele-text)", border: "var(--care-tele-border)" };
  if (level <= 6)
    return { bg: "var(--care-primary-bg)", text: "var(--care-primary-text)", border: "var(--care-primary-border)" };
  if (level <= 8)
    return { bg: "var(--care-urgent-bg)", text: "var(--care-urgent-text)", border: "var(--care-urgent-border)" };
  return { bg: "var(--care-er-bg)", text: "var(--care-er-text)", border: "var(--care-er-border)" };
}

function severityIcon(n: number): string {
  if (n <= 2) return "●";
  if (n <= 4) return "◑";
  if (n <= 6) return "◕";
  if (n <= 8) return "▲";
  return "⚠";
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type Group = { date: string; entries: SymptomEntry[] };

function groupByDate(entries: SymptomEntry[]): Group[] {
  const map = new Map<string, SymptomEntry[]>();
  for (const entry of entries) {
    const existing = map.get(entry.date) ?? [];
    map.set(entry.date, [...existing, entry]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([date, ents]) => ({
      date,
      entries: [...ents].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time > b.time ? 1 : -1;
      }),
    }));
}

type EntryRowProps = {
  entry: SymptomEntry;
  onDelete: (id: string) => void;
};

function EntryRow({ entry, onDelete }: EntryRowProps) {
  const handleDelete = useCallback(() => onDelete(entry.id), [entry.id, onDelete]);
  const sev = entry.severity;

  return (
    <li
      className="group flex items-start gap-3 rounded-xl px-4 py-3 transition-shadow duration-[var(--duration-fast)] hover:shadow-sm"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Timeline dot */}
      <div
        aria-hidden="true"
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          background: sev !== undefined ? severityStyle(sev).text : "var(--accent)",
          boxShadow: `0 0 0 3px ${sev !== undefined ? severityStyle(sev).bg : "var(--accent-soft)"}`,
        }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {entry.time && (
            <span
              className="tabular-nums text-xs font-medium"
              style={{ color: "var(--text-subtle)" }}
            >
              {entry.time}
            </span>
          )}
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
            {entry.label}
          </p>
          {sev !== undefined && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                background: severityStyle(sev).bg,
                color: severityStyle(sev).text,
                border: `1px solid ${severityStyle(sev).border}`,
              }}
              aria-label={`Severity ${sev} out of 10`}
            >
              <span aria-hidden="true">{severityIcon(sev)}</span>
              {sev}/10
            </span>
          )}
        </div>
        {entry.notes && (
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {entry.notes}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Delete entry: ${entry.label}`}
        className="ml-1 shrink-0 rounded-full p-1.5 opacity-0 transition-all duration-[var(--duration-fast)] hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-red-950 dark:hover:text-red-400"
        style={{ color: "var(--text-subtle)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 2l10 10M12 2L2 12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-5 rounded-2xl px-8 py-16 text-center"
      style={{
        border: "2px dashed var(--border-strong)",
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "var(--accent-soft)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="2" width="18" height="20" rx="2" stroke="var(--accent)" strokeWidth="1.5" />
          <path
            d="M8 8h8M8 12h8M8 16h5"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          No symptoms logged yet
        </p>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Add your first entry above — your log feeds into triage automatically so you don&apos;t
          have to repeat yourself.
        </p>
      </div>
    </div>
  );
}

const INPUT_BASE =
  "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-[var(--duration-fast)]";

export default function TimelinePage() {
  const log = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const groups = groupByDate(log.entries);

  const [severity, setSeverity] = useState<number>(0);

  const handleSeverityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSeverity(parseInt(e.target.value, 10));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);

      const date = (data.get("date") as string | null) ?? todayISO();
      const time = ((data.get("time") as string | null) ?? "").trim();
      const label = ((data.get("label") as string | null) ?? "").trim();
      const notes = ((data.get("notes") as string | null) ?? "").trim();

      if (!label) return;

      addSymptomEntry({
        date,
        ...(time ? { time } : {}),
        label,
        ...(severity > 0 ? { severity } : {}),
        ...(notes ? { notes } : {}),
      });

      window.dispatchEvent(new Event("storage"));
      form.reset();
      setSeverity(0);

      const dateInput = form.elements.namedItem("date") as HTMLInputElement | null;
      if (dateInput) dateInput.value = todayISO();
    },
    [severity]
  );

  const handleDelete = useCallback((id: string) => {
    removeSymptomEntry(id);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const sevStyle = severity > 0 ? severityStyle(severity) : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">

      {/* Page header */}
      <header className="text-center animate-fade-up">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--accent)" }}
        >
          Symptom Timeline
        </p>
        <h1
          className="mt-2 font-display text-4xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Track how you feel
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Log symptoms and events over time — your history feeds into your voice triage session
          automatically.
        </p>
      </header>

      {/* Add entry form */}
      <section
        aria-labelledby="add-entry-heading"
        className="rounded-2xl p-6 animate-fade-up stagger-1"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          id="add-entry-heading"
          className="mb-5 text-xs font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-subtle)" }}
        >
          Add entry
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tl-date"
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Date
              </label>
              <input
                id="tl-date"
                name="date"
                type="date"
                defaultValue={todayISO()}
                required
                className={INPUT_BASE}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tl-time"
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Time{" "}
                <span style={{ color: "var(--text-subtle)" }}>(optional)</span>
              </label>
              <input
                id="tl-time"
                name="time"
                type="time"
                className={INPUT_BASE}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Symptom label */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="tl-label"
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Symptom or event{" "}
              <span style={{ color: "var(--care-er-text)" }}>*</span>
            </label>
            <input
              id="tl-label"
              name="label"
              type="text"
              placeholder="e.g. Headache, Took ibuprofen, Fever 101 °F"
              required
              maxLength={200}
              className={INPUT_BASE}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Severity slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="tl-severity"
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Severity{" "}
                <span style={{ color: "var(--text-subtle)" }}>(optional, 1–10)</span>
              </label>
              {severity > 0 && sevStyle && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: sevStyle.bg,
                    color: sevStyle.text,
                    border: `1px solid ${sevStyle.border}`,
                  }}
                  aria-live="polite"
                  aria-label={`Severity ${severity} out of 10`}
                >
                  <span aria-hidden="true">{severityIcon(severity)}</span>
                  {severity}/10
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                None
              </span>
              <input
                id="tl-severity"
                name="severity"
                type="range"
                min={0}
                max={10}
                step={1}
                value={severity}
                onChange={handleSeverityChange}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full"
                style={{ accentColor: "var(--accent)", background: "var(--surface-2)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                10
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="tl-notes"
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Notes{" "}
              <span style={{ color: "var(--text-subtle)" }}>(optional)</span>
            </label>
            <textarea
              id="tl-notes"
              name="notes"
              rows={2}
              maxLength={400}
              placeholder="Any additional context…"
              className="resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-colors duration-[var(--duration-fast)]"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="self-end px-6 py-2.5 text-sm font-semibold transition-all duration-[var(--duration-fast)] hover:scale-[1.02] hover:opacity-90 active:scale-[0.98]"
          >
            Add entry
          </button>
        </form>
      </section>

      {/* Symptom log */}
      <section aria-labelledby="log-heading" className="flex flex-col gap-6 animate-fade-up stagger-2">
        <h2 id="log-heading" className="sr-only">
          Symptom log
        </h2>

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map(({ date, entries }) => (
            <div key={date} className="flex flex-col gap-2">
              {/* Date group header */}
              <div className="flex items-center gap-3">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.15em]"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {formatDate(date)}
                </p>
                <div className="h-px flex-1" style={{ background: "var(--border)" }} aria-hidden="true" />
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-subtle)",
                    border: "1px solid var(--border)",
                  }}
                  aria-label={`${entries.length} entries on this day`}
                >
                  {entries.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} onDelete={handleDelete} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <div className="flex justify-center py-2 animate-fade-up stagger-3">
        <SafetyDisclaimer />
      </div>

      <div className="flex justify-center animate-fade-up stagger-4">
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-4 transition-opacity duration-[var(--duration-fast)] hover:opacity-70"
          style={{ color: "var(--accent)" }}
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
