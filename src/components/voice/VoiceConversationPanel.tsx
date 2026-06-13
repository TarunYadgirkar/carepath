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

      <section
        className="flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl p-6 ring-1"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            </svg>
            Live conversation
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Voice: {CAREPATH_VOICE_SETTINGS.voiceLabel}
          </span>
        </div>

        <VoiceOrb status={status} />

        {!conversationActive && <div className="w-full">{insuranceSelector}</div>}

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-3">
          {conversationActive ? (
            <button
              onClick={stop}
              aria-label="End conversation"
              className="min-h-[44px] min-w-[176px] rounded-full px-6 py-3 text-sm font-medium ring-1 transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                borderColor: "var(--border-strong)",
              }}
            >
              End Conversation
            </button>
          ) : (
            <button
              onClick={start}
              disabled={(useFallbackVoice ? !voiceSupported : !grokSupported) || classifying}
              aria-label="Start live voice conversation"
              className="min-h-[44px] min-w-[200px] rounded-full px-7 py-3 text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              style={{
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              Start Live Conversation
            </button>
          )}

          {(useFallbackVoice ? !voiceSupported : !grokSupported) && (
            <p
              className="max-w-xs text-center text-xs leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Live conversation needs a browser with microphone access (Chrome or Edge). Try the
              demo below instead.
            </p>
          )}
        </div>

        {/* Error state */}
        {error && (
          <p
            className="rounded-lg px-3 py-2 text-xs"
            role="alert"
            style={{
              background: "var(--care-er-bg)",
              color: "var(--care-er-text)",
              border: "1px solid var(--care-er-border)",
            }}
          >
            {error}
          </p>
        )}

        {/* Fallback voice switch */}
        {!useFallbackVoice && (error || !grokSupported) && voiceSupported && !conversationActive && (
          <button
            onClick={() => setUseFallbackVoice(true)}
            className="text-xs underline transition-colors"
            style={{ color: "var(--text-subtle)" }}
          >
            Grok Voice unavailable — switch to browser voice instead
          </button>
        )}

        {/* Live transcript */}
        {(conversationActive || messages.length > 0) && (
          <div
            className="flex w-full flex-col gap-3 rounded-xl p-4"
            aria-live="polite"
            aria-label="Live transcript"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-subtle)" }}
            >
              Live transcript
            </p>

            {liveHint && (
              <p
                className="min-h-[1.25rem] text-sm italic"
                role="status"
                style={{ color: "var(--accent)" }}
              >
                {liveHint}
              </p>
            )}

            {messages.length > 0 ? (
              <div className="flex max-h-64 flex-col gap-2.5 overflow-y-auto">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                      message.role === "user" ? "self-end text-right" : "self-start"
                    }`}
                    style={
                      message.role === "user"
                        ? {
                            background: "var(--accent-soft)",
                            color: "var(--accent)",
                            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                          }
                        : {
                            background: "var(--surface)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border)",
                            boxShadow: "var(--shadow-xs)",
                          }
                    }
                  >
                    <p
                      className="mb-1 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-subtle)" }}
                    >
                      {message.role === "user" ? "You" : "CarePath"}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
                Transcript will appear here as you talk.
              </p>
            )}
          </div>
        )}
      </section>

      {demoSlot && !conversationActive && (
        <div
          className="flex w-full max-w-xl items-center gap-3 text-xs"
          style={{ color: "var(--text-subtle)" }}
        >
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          or
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>
      )}

      {!conversationActive && demoSlot}
    </>
  );
}
