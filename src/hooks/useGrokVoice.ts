"use client";

import { useCallback, useRef, useState } from "react";
import { AudioPlaybackQueue, startAudioCapture, type AudioCapture } from "@/lib/audio";

export type VoiceStatus = "idle" | "connecting" | "active" | "ended" | "error";

const INTAKE_INSTRUCTIONS = `You are CarePath, a calm voice intake assistant. Ask short, plain-language
questions one at a time to learn: the patient's main symptom and how long they've had it,
whether they have any red-flag symptoms (trouble breathing, chest pain, confusion, severe
bleeding, loss of consciousness), their current medications and allergies, and their
insurance plan and remaining deductible if known. Keep responses brief. Once you have
enough information, call the end_consultation function with a clean summary of what the
patient said. You are a navigation tool, not a diagnosis system — never diagnose, and if
the patient describes a clear emergency, tell them to call 911 immediately.`;

interface UseGrokVoiceResult {
  status: VoiceStatus;
  error: string | null;
  patientTranscript: string;
  aiTranscript: string;
  start: () => Promise<void>;
  stop: () => void;
}

export function useGrokVoice(
  onConsultationEnd: (transcriptSummary: string) => void
): UseGrokVoiceResult {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [patientTranscript, setPatientTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlaybackQueue | null>(null);

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

  const start = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    setPatientTranscript("");
    setAiTranscript("");

    try {
      const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.token) {
        throw new Error(tokenData.error ?? "Failed to fetch realtime token");
      }

      const ws = new WebSocket(
        `wss://api.x.ai/v1/realtime?model=${tokenData.model}`,
        ["realtime", `openai-insecure-api-key.${tokenData.token}`, "openai-beta.realtime-v1"]
      );
      wsRef.current = ws;
      playbackRef.current = new AudioPlaybackQueue();

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: INTAKE_INSTRUCTIONS,
              voice: "Eve",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
              tools: [
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

        startAudioCapture((base64) => {
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
          case "response.audio.delta":
            playbackRef.current?.enqueue(msg.delta);
            break;

          case "response.audio_transcript.delta":
            setAiTranscript((prev) => prev + msg.delta);
            break;

          case "conversation.item.input_audio_transcription.completed":
            setPatientTranscript((prev) => prev + (prev ? "\n" : "") + msg.transcript);
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

          case "error":
            setError(msg.error?.message ?? "Grok Voice error");
            setStatus("error");
            cleanup();
            break;
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
  }, [cleanup, onConsultationEnd]);

  return { status, error, patientTranscript, aiTranscript, start, stop };
}
