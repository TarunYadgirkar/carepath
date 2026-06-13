export function SafetyDisclaimer() {
  return (
    <aside
      aria-label="Safety information"
      className="flex w-full max-w-md flex-col gap-2 rounded-xl px-4 py-3 ring-1"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: "var(--text-muted)" }}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            CarePath is a navigation tool, not a diagnosis system.
          </span>{" "}
          If you are experiencing an emergency — trouble breathing, chest pain, loss of
          consciousness — call 911 immediately.
        </p>
      </div>
      <p className="pl-6 text-xs leading-relaxed" style={{ color: "var(--text-subtle)" }}>
        Your records, medications, and care cards are stored only in your browser — never on a
        server or database, and never shared without you choosing to.
      </p>
    </aside>
  );
}
