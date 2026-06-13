"use client";

import { useCallback, useRef, useState } from "react";
import { AudioPlaybackQueue, startAudioCapture, type AudioCapture } from "@/lib/audio";
import { buildEpicContext, getEpicImport } from "@/lib/epic-import";
import { buildMedCardContext, getMedCard } from "@/lib/medcard";
import { buildSymptomLogContext, getSymptomLog } from "@/lib/symptom-log";
import { VOICE_INSTRUCTIONS, type ConversationMode } from "@/lib/mode-prompts";

export type VoiceStatus = "idle" | "connecting" | "active" | "ended" | "error";

export interface GrokTranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseGrokVoiceResult {
  status: VoiceStatus;
  error: string | null;
  messages: GrokTranscriptMessage[];
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  muted: boolean;
  toggleMute: () => void;
}

export function useGrokVoice(
  onConsultationEnd: (transcriptSummary: string) => void,
  mode: ConversationMode = "triage",
  insurancePlanName?: string
): UseGrokVoiceResult {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<GrokTranscriptMessage[]>([]);

  const [muted, setMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlaybackQueue | null>(null);
  const responseActiveRef = useRef(false);
  const mutedRef = useRef(false);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }, []);

  const cleanup = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    playbackRef.current?.close();
    playbackRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setStatus("ended");
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setError(null);
    setMessages([]);
    responseActiveRef.current = false;
  }, [cleanup]);

  const start = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    setMessages([]);
    mutedRef.current = false;
    setMuted(false);

    try {
      const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.token) {
        throw new Error(tokenData.error ?? "Failed to fetch realtime token");
      }

      const ws = new WebSocket(
        `wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.0`,
        [`xai-client-secret.${tokenData.token}`]
      );
      wsRef.current = ws;
      playbackRef.current = new AudioPlaybackQueue();

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              voice: "eve",
              instructions:
                VOICE_INSTRUCTIONS[mode] +
                buildMedCardContext(getMedCard()) +
                buildEpicContext(getEpicImport()) +
                buildSymptomLogContext(getSymptomLog()) +
                (insurancePlanName
                  ? `\n\nThe patient's insurance plan is: ${insurancePlanName}. Use this for any cost-related context.`
                  : "") +
                "\n\nOPENING: You speak first. Open with a short greeting (2-3 sentences) that introduces you as CarePath and briefly names what you can do — including that you can verify and fact-check medical information on the web in real time while they speak, estimate costs against their insurance, and point them to relevant patient communities — then invite them to begin.",
              turn_detection: { type: "server_vad" },
              input_audio_transcription: { model: "grok-2-audio" },
              audio: {
                input: { format: { type: "audio/pcm", rate: 24000 } },
                output: { format: { type: "audio/pcm", rate: 24000 } },
              },
              tools: [
                { type: "web_search" },
                {
                  type: "function",
                  name: "end_consultation",
                  description:
                    "Call this when you have gathered enough information to generate a care recommendation.",
                  parameters: {
                    type: "object",
                    properties: {
                      transcript_summary: {
                        type: "string",
                        description: "A clean summary of what the patient said",
                      },
                    },
                    required: ["transcript_summary"],
                  },
                },
              ],
            },
          })
        );

        // Ask the model to speak first — send an empty response.create so the
        // assistant produces its opening greeting before the user says anything.
        responseActiveRef.current = true;
        ws.send(JSON.stringify({ type: "response.create" }));

        startAudioCapture((base64) => {
          if (mutedRef.current || ws.readyState !== WebSocket.OPEN || ws.bufferedAmount > 1_000_000) return;
          ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64 }));
        })
          .then((capture) => {
            captureRef.current = capture;
            setStatus("active");
          })
          .catch((err) => {
            setError(`Microphone error: ${err.message}`);
            setStatus("error");
          });
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "input_audio_buffer.speech_started":
            playbackRef.current?.clear();
            if (responseActiveRef.current) {
              ws.send(JSON.stringify({ type: "response.cancel" }));
              responseActiveRef.current = false;
            }
            // Begin one fresh user bubble for this utterance; interim
            // transcripts update it in place instead of stacking duplicates.
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "user" && last.content === "") return prev;
              return [...prev, { role: "user", content: "" }];
            });
            break;

          case "response.created":
            responseActiveRef.current = true;
            // Start a fresh assistant bubble for this turn so the transcript
            // reads as a back-and-forth conversation instead of one
            // ever-growing block of text.
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
            break;

          case "response.done":
          case "response.cancelled":
            responseActiveRef.current = false;
            break;

          case "response.output_audio.delta":
            playbackRef.current?.enqueue(msg.delta);
            break;

          case "response.output_audio_transcript.delta":
            setMessages((prev) => {
              if (prev.length === 0 || prev[prev.length - 1].role !== "assistant") return prev;
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), { ...last, content: last.content + msg.delta }];
            });
            break;

          case "conversation.item.input_audio_transcription.delta":
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (!last || last.role !== "user") {
                return [...prev, { role: "user", content: msg.delta ?? "" }];
              }
              return [...prev.slice(0, -1), { ...last, content: last.content + (msg.delta ?? "") }];
            });
            break;

          case "conversation.item.input_audio_transcription.completed":
            setMessages((prev) => {
              const text = msg.transcript ?? "";
              const last = prev[prev.length - 1];
              // Replace the in-progress user bubble with the final transcript
              // instead of appending — avoids the repeated, growing duplicates.
              if (last && last.role === "user") {
                return [...prev.slice(0, -1), { ...last, content: text }];
              }
              return [...prev, { role: "user", content: text }];
            });
            break;

          case "response.function_call_arguments.done":
            if (msg.name === "end_consultation") {
              try {
                const args = JSON.parse(msg.arguments);
                cleanup();
                setStatus("ended");
                onConsultationEnd(args.transcript_summary ?? "");
              } catch {
                cleanup();
                setStatus("ended");
                onConsultationEnd("");
              }
            }
            break;

          case "error": {
            const message: string = msg.error?.message ?? "Grok Voice error";
            // response.cancel can race with the server already finishing the
            // response — harmless, don't tear down the session for it.
            if (/no active response/i.test(message)) break;
            setError(message);
            setStatus("error");
            cleanup();
            break;
          }
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
        setStatus("error");
        cleanup();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start voice session");
      setStatus("error");
      cleanup();
    }
  }, [cleanup, onConsultationEnd, mode, insurancePlanName]);

  return { status, error, messages, start, stop, reset, muted, toggleMute };
}
