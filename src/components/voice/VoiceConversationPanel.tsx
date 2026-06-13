"use client";

import { useEffect, useRef, useState } from "react";
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
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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
  const reset = useFallbackVoice ? fallbackVoice.reset : grokVoice.reset;
  const muted = useFallbackVoice ? fallbackVoice.muted : grokVoice.muted;
  const toggleMute = useFallbackVoice ? fallbackVoice.toggleMute : grokVoice.toggleMute;
  const messages = useFallbackVoice ? fallbackVoice.messages : grokVoice.messages;

  // Sync transcript scroll position to the newest message — this is DOM
  // synchronization, not a state update, so useEffect is the correct tool.
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl p-6 ring-1"
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={stop}
                aria-label="End conversation"
                className="min-h-[44px] min-w-[160px] rounded-full px-6 py-3 text-sm font-medium ring-1 transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-strong)",
                }}
              >
                End Conversation
              </button>
              <button
                onClick={toggleMute}
                aria-pressed={muted}
                aria-label={muted ? "Unmute your microphone" : "Mute your microphone so CarePath keeps talking"}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-3 text-sm font-medium ring-1 transition-all duration-150 hover:opacity-80 active:scale-95"
                style={
                  muted
                    ? { background: "var(--care-er-bg)", color: "var(--care-er-text)", borderColor: "var(--care-er-border)" }
                    : { background: "var(--surface-2)", color: "var(--text-primary)", borderColor: "var(--border-strong)" }
                }
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {muted ? (
                    <>
                      <line x1="2" y1="2" x2="22" y2="22" />
                      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                      <path d="M5 10v2a7 7 0 0 0 12 5" />
                      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </>
                  ) : (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </>
                  )}
                </svg>
                {muted ? "Unmute mic" : "Mute mic"}
              </button>
            </div>
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

          {(status === "ended" || (status !== "idle" && !conversationActive) || messages.length > 0) && (
            <button
              onClick={reset}
              aria-label="Reset and start over"
              className="min-h-[36px] rounded-full px-5 py-1.5 text-xs font-medium ring-1 transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-muted)",
                borderColor: "var(--border)",
              }}
            >
              Reset / start over
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
                <div ref={transcriptEndRef} aria-hidden="true" />
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
          className="mx-auto flex w-full max-w-xl items-center gap-3 text-xs"
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
