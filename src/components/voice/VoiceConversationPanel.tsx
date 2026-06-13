"use client";

import { useEffect, useState } from "react";
import { isVoiceConversationSupported, useVoiceConversation } from "@/hooks/useVoiceConversation";
import { useGrokVoice } from "@/hooks/useGrokVoice";
import { CAREPATH_VOICE_SETTINGS } from "@/data/voice-settings";
import { VoiceOrb, type OrbStatus } from "@/components/VoiceOrb";
import { EmergencyBanner, hasEmergencyPhrase } from "@/components/EmergencyBanner";
import type { ConversationMode } from "@/lib/mode-prompts";

function isGrokVoiceSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    "AudioContext" in window
  );
}

const STATUS_HINT: Record<string, string> = {
  connecting: "Connecting to CarePath…",
  listening: "Listening for your voice…",
  thinking: "CarePath is thinking…",
  speaking: "CarePath is speaking…",
};

type Props = {
  mode: ConversationMode;
  onConsultationEnd: (transcriptSummary: string) => void;
  insurancePlanName?: string;
  classifying?: boolean;
  insuranceSelector?: React.ReactNode;
  demoSlot?: React.ReactNode;
};

export function VoiceConversationPanel({
  mode,
  onConsultationEnd,
  insurancePlanName,
  classifying = false,
  insuranceSelector,
  demoSlot,
}: Props) {
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [grokSupported, setGrokSupported] = useState(false);
  const [useFallbackVoice, setUseFallbackVoice] = useState(false);

  useEffect(() => {
    const voice = isVoiceConversationSupported();
    const grok = isGrokVoiceSupported();
    queueMicrotask(() => {
      setVoiceSupported(voice);
      setGrokSupported(grok);
    });
  }, []);

  const fallbackVoice = useVoiceConversation(onConsultationEnd, mode);
  const grokVoice = useGrokVoice(onConsultationEnd, mode, insurancePlanName);

  const status: OrbStatus = useFallbackVoice
    ? fallbackVoice.status
    : grokVoice.status === "active"
      ? "listening"
      : grokVoice.status;

  const error = useFallbackVoice ? fallbackVoice.error : grokVoice.error;
  const start = useFallbackVoice ? fallbackVoice.start : grokVoice.start;
  const stop = useFallbackVoice ? fallbackVoice.stop : grokVoice.stop;
  const messages = useFallbackVoice ? fallbackVoice.messages : grokVoice.messages;

  const conversationActive =
    status === "connecting" || status === "listening" || status === "thinking" || status === "speaking";

  const liveTranscript = useFallbackVoice
    ? `${fallbackVoice.interimTranscript} ${messages.map((m) => m.content).join(" ")}`
    : messages.map((m) => m.content).join(" ");
  const showEmergencyBanner = hasEmergencyPhrase(liveTranscript);

  const liveHint = useFallbackVoice
    ? status === "listening" && fallbackVoice.interimTranscript
      ? `You: ${fallbackVoice.interimTranscript}`
      : status === "speaking" && fallbackVoice.speakingText
        ? `CarePath: ${fallbackVoice.speakingText}`
        : STATUS_HINT[status] ?? null
    : messages.length > 0
      ? null
      : STATUS_HINT[status] ?? null;

  return (
    <>
      <EmergencyBanner show={showEmergencyBanner} />

      <section className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            Live conversation
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Voice: {CAREPATH_VOICE_SETTINGS.voiceLabel}
          </span>
        </div>

        <VoiceOrb status={status} />

        {!conversationActive && insuranceSelector}

        {conversationActive ? (
          <button
            onClick={stop}
            className="rounded-full border border-current px-6 py-3 font-medium transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            End Conversation
          </button>
        ) : (
          <button
            onClick={start}
            disabled={(useFallbackVoice ? !voiceSupported : !grokSupported) || classifying}
            className="rounded-full bg-[var(--accent)] px-6 py-3 font-medium text-white transition-transform duration-150 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            Start Live Conversation
          </button>
        )}

        {(useFallbackVoice ? !voiceSupported : !grokSupported) && (
          <p className="text-center text-sm text-zinc-500">
            Live conversation needs a browser with microphone access (Chrome or Edge). Try the demo below instead.
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {!useFallbackVoice && (error || !grokSupported) && voiceSupported && !conversationActive && (
          <button
            onClick={() => setUseFallbackVoice(true)}
            className="text-xs text-zinc-500 underline transition-colors hover:text-[var(--accent)]"
          >
            Grok Voice unavailable — switch to browser voice instead
          </button>
        )}

        {(conversationActive || messages.length > 0) && (
          <div
            className="flex w-full flex-col gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900"
            aria-live="polite"
            aria-label="Live transcript"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Live transcript</p>

            {liveHint && (
              <p className="min-h-[1.25rem] text-sm italic text-[var(--accent)]" role="status">
                {liveHint}
              </p>
            )}

            {messages.length > 0 ? (
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto text-sm">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "self-end bg-[var(--accent-soft)] text-right"
                        : "self-start bg-white dark:bg-zinc-950"
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium text-zinc-500">
                      {message.role === "user" ? "You" : "CarePath"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Transcript will appear here as you talk.</p>
            )}
          </div>
        )}
      </section>

      {demoSlot && !conversationActive && (
        <div className="flex w-full max-w-xl items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          or
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      )}

      {!conversationActive && demoSlot}
    </>
  );
}
