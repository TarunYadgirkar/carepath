export function SiteFooter() {
  return (
    <footer
      className="mt-auto w-full"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      {/* Safety banner — always visible, full-width warm tint */}
      <div
        className="w-full px-6 py-3 text-center text-sm font-medium"
        role="note"
        aria-label="Safety notice"
        style={{
          background: "var(--care-er-bg)",
          color: "var(--care-er-text)",
          borderBottom: "1px solid var(--care-er-border)",
        }}
      >
        If you are experiencing an emergency — trouble breathing, chest pain, or loss of consciousness — <strong>call 911 immediately.</strong>
      </div>

      {/* Footer body */}
      <div
        className="mx-auto max-w-5xl px-6 py-5 text-center"
        style={{ color: "var(--text-subtle)" }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          CarePath is a navigation tool, not a diagnosis system. AI estimates are not medical advice — verify with a licensed clinician.
        </p>
        <p className="mt-2 text-xs">
          © {new Date().getFullYear()} CarePath &mdash; Hackathon demo project.
        </p>
      </div>
    </footer>
  );
}
