import type { VoiceStatus } from "@/hooks/useGrokVoice";

type Props = {
  status: VoiceStatus;
};

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "Ready when you are",
  connecting: "Connecting…",
  active: "Listening…",
  ended: "Conversation ended",
  error: "Connection error",
};

const CORE_STYLES: Record<VoiceStatus, string> = {
  idle: "bg-zinc-300 dark:bg-zinc-700",
  connecting: "bg-zinc-300 dark:bg-zinc-700",
  active: "bg-[var(--accent)]",
  ended: "bg-zinc-300 dark:bg-zinc-700",
  error: "bg-red-500",
};

export function VoiceOrb({ status }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-32 w-32 items-center justify-center" aria-hidden="true">
        {status === "active" && (
          <span className="absolute inset-0 animate-[orb-pulse_1.8s_ease-in-out_infinite] rounded-full bg-[var(--accent)]/30" />
        )}
        {status === "connecting" && (
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--accent)]/25 border-t-[var(--accent)]" />
        )}
        <span className={`relative h-20 w-20 rounded-full transition-colors duration-300 ${CORE_STYLES[status]}`} />
      </div>
      <p className="text-sm text-zinc-500" role="status">
        {STATUS_LABEL[status]}
      </p>
    </div>
  );
}
