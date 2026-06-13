export function SafetyDisclaimer() {
  return (
    <div className="flex max-w-md flex-col gap-1.5 text-center">
      <p className="text-xs text-zinc-500">
        CarePath is a navigation tool, not a diagnosis system. If you are experiencing an
        emergency — trouble breathing, chest pain, loss of consciousness — call 911
        immediately.
      </p>
      <p className="text-xs text-zinc-400">
        Your records, medications, and care cards are stored only in your browser — never
        on a server or database, and never shared without you choosing to.
      </p>
    </div>
  );
}
