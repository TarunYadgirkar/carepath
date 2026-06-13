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

const SEVERITY_BADGE: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  2: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  3: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
  4: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
  5: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  6: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  7: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  8: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  9: "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200",
  10: "bg-red-300 text-red-950 dark:bg-red-800 dark:text-red-100",
};

function severityBadgeClass(n: number): string {
  return SEVERITY_BADGE[Math.max(1, Math.min(10, Math.round(n)))] ?? SEVERITY_BADGE[5];
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

  return (
    <li className="group flex items-start gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-zinc-100 transition-shadow duration-150 hover:shadow-sm dark:bg-zinc-950 dark:ring-zinc-800">
      <div
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)] ring-2 ring-[var(--accent-soft)]"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {entry.time && (
            <span className="tabular-nums text-xs text-zinc-400">{entry.time}</span>
          )}
          <p className="text-sm font-medium leading-snug">{entry.label}</p>
          {entry.severity !== undefined && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityBadgeClass(entry.severity)}`}
            >
              {entry.severity}/10
            </span>
          )}
        </div>
        {entry.notes && (
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{entry.notes}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Delete entry: ${entry.label}`}
        className="ml-1 shrink-0 rounded-full p-1.5 text-zinc-300 opacity-0 transition-all duration-150 hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-red-950 dark:hover:text-red-400"
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
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-200 px-8 py-16 text-center dark:border-zinc-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect x="3" y="1" width="16" height="20" rx="2" stroke="var(--accent)" strokeWidth="1.5" />
          <path
            d="M7 7h8M7 11h8M7 15h4"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p className="font-medium">No symptoms logged yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Add your first entry above — your log feeds into triage automatically so you don&apos;t
          have to repeat yourself.
        </p>
      </div>
    </div>
  );
}

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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Symptom Timeline
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Track how you feel</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Log symptoms and events over time — your history feeds into your voice triage session
          automatically.
        </p>
      </header>

      <section
        aria-labelledby="add-entry-heading"
        className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
      >
        <h2
          id="add-entry-heading"
          className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500"
        >
          Add entry
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tl-date"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Date
              </label>
              <input
                id="tl-date"
                name="date"
                type="date"
                defaultValue={todayISO()}
                required
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tl-time"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Time <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                id="tl-time"
                name="time"
                type="time"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="tl-label"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Symptom or event <span className="text-red-500">*</span>
            </label>
            <input
              id="tl-label"
              name="label"
              type="text"
              placeholder="e.g. Headache, Took ibuprofen, Fever 101 °F"
              required
              maxLength={200}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-[var(--accent)] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="tl-severity"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                Severity <span className="text-zinc-400">(optional, 1–10)</span>
              </label>
              {severity > 0 && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityBadgeClass(severity)}`}
                >
                  {severity}/10
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">None</span>
              <input
                id="tl-severity"
                name="severity"
                type="range"
                min={0}
                max={10}
                step={1}
                value={severity}
                onChange={handleSeverityChange}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[var(--accent)] dark:bg-zinc-700"
              />
              <span className="text-xs text-zinc-400">10</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="tl-notes"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
            >
              Notes <span className="text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="tl-notes"
              name="notes"
              rows={2}
              maxLength={400}
              placeholder="Any additional context…"
              className="resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-[var(--accent)] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <button
            type="submit"
            className="self-end rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            Add entry
          </button>
        </form>
      </section>

      <section aria-labelledby="log-heading" className="flex flex-col gap-6">
        <h2 id="log-heading" className="sr-only">
          Symptom log
        </h2>

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map(({ date, entries }) => (
            <div key={date} className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                {formatDate(date)}
              </p>
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} onDelete={handleDelete} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <div className="flex justify-center py-2">
        <SafetyDisclaimer />
      </div>

      <div className="flex justify-center">
        <Link href="/" className="text-sm text-[var(--accent)] underline underline-offset-2">
          Back home
        </Link>
      </div>
    </main>
  );
}
