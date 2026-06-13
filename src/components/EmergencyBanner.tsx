export { hasEmergencyIndicator as hasEmergencyPhrase } from "@/lib/emergency-keywords";

export function EmergencyBanner({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full max-w-xl animate-fade-in overflow-hidden rounded-xl ring-1"
      style={{
        background: "var(--care-er-bg)",
        borderColor: "var(--care-er-border)",
        color: "var(--care-er-text)",
      }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3.5"
      >
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: "var(--care-er-ring)" }}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold leading-snug">
            If this is a medical emergency, call 911 immediately.
          </p>
          <p className="text-xs font-normal opacity-80">
            Do not wait. Do not drive yourself. Call now.
          </p>
        </div>
      </div>
    </div>
  );
}
