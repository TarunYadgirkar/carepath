export type OrbStatus =
  | "idle"
  | "connecting"
  | "active"
  | "listening"
  | "thinking"
  | "speaking"
  | "ended"
  | "error";

type Props = {
  status: OrbStatus;
};

const STATUS_LABEL: Record<OrbStatus, string> = {
  idle: "Ready when you are",
  connecting: "Connecting…",
  active: "Listening…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  ended: "Conversation ended",
  error: "Connection error",
};

const STATUS_SUBLABEL: Record<OrbStatus, string | null> = {
  idle: "Tap to start",
  connecting: "Establishing connection",
  active: "Speak naturally",
  listening: "Speak naturally",
  thinking: "Processing your symptoms",
  speaking: "CarePath is responding",
  ended: "Analyzing your conversation…",
  error: "Check your microphone and try again",
};

const PULSE_STATUSES: ReadonlySet<OrbStatus> = new Set(["active", "listening", "speaking"]);
const SPINNER_STATUSES: ReadonlySet<OrbStatus> = new Set(["connecting", "thinking"]);
const ACTIVE_STATUSES: ReadonlySet<OrbStatus> = new Set([
  "active",
  "listening",
  "thinking",
  "speaking",
  "connecting",
]);

export function VoiceOrb({ status }: Props) {
  const isActive = ACTIVE_STATUSES.has(status);
  const isError = status === "error";
  const isSpeaking = status === "speaking";

  const orbColor = isError
    ? "var(--care-er-ring)"
    : isActive
      ? "var(--accent)"
      : "var(--border-strong)";

  const orbGlow = isActive && !isError
    ? "color-mix(in srgb, var(--accent) 20%, transparent)"
    : isError
      ? "color-mix(in srgb, var(--care-er-ring) 20%, transparent)"
      : "transparent";

  const sublabel = STATUS_SUBLABEL[status];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative flex h-36 w-36 items-center justify-center"
        aria-hidden="true"
      >
        {/* Ambient glow ring — pulse on listen/speak */}
        {PULSE_STATUSES.has(status) && (
          <span
            className="absolute inset-0 animate-[orb-pulse_2s_ease-in-out_infinite] rounded-full"
            style={{ background: orbGlow }}
          />
        )}

        {/* Mid ring — additional depth on speaking */}
        {isSpeaking && (
          <span
            className="absolute animate-[orb-pulse_1.4s_ease-in-out_infinite] rounded-full"
            style={{
              inset: "10px",
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              animationDelay: "200ms",
            }}
          />
        )}

        {/* Spinner arc for connecting / thinking */}
        {SPINNER_STATUSES.has(status) && (
          <span
            className="absolute inset-2 animate-spin rounded-full border-[1.5px]"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
              borderTopColor: "var(--accent)",
            }}
          />
        )}

        {/* Core orb */}
        <span
          className="relative flex h-20 w-20 items-center justify-center rounded-full transition-[background,box-shadow] duration-500"
          style={{
            background: isActive
              ? `radial-gradient(circle at 38% 38%, color-mix(in srgb, ${orbColor} 90%, white), ${orbColor})`
              : isError
                ? `radial-gradient(circle at 38% 38%, color-mix(in srgb, var(--care-er-ring) 90%, white), var(--care-er-ring))`
                : "var(--surface-2)",
            border: `1.5px solid ${isActive || isError ? "transparent" : "var(--border)"}`,
            boxShadow: isActive
              ? `0 0 0 6px color-mix(in srgb, var(--accent) 10%, transparent), var(--shadow-md)`
              : isError
                ? `0 0 0 6px color-mix(in srgb, var(--care-er-ring) 10%, transparent), var(--shadow-sm)`
                : "var(--shadow-xs)",
          }}
        >
          {/* Inner mic/wave icon hint */}
          {(status === "listening" || status === "active") && (
            <svg
              aria-hidden="true"
              className="h-7 w-7 opacity-70"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
          )}
          {status === "speaking" && (
            <svg
              aria-hidden="true"
              className="h-7 w-7 opacity-70"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
          {status === "thinking" && (
            <svg
              aria-hidden="true"
              className="h-7 w-7 opacity-70"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
            </svg>
          )}
          {status === "idle" && (
            <svg
              aria-hidden="true"
              className="h-6 w-6 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
            </svg>
          )}
          {status === "error" && (
            <svg
              aria-hidden="true"
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          )}
          {(status === "ended" || status === "connecting") && (
            <span className="h-4 w-4 rounded-full" style={{ background: "white", opacity: 0.6 }} />
          )}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p
          className="text-sm font-medium"
          role="status"
          style={{ color: "var(--text-primary)" }}
        >
          {STATUS_LABEL[status]}
        </p>
        {sublabel && (
          <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
