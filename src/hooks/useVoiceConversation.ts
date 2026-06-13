"use client";

import { useCallback, useRef, useState } from "react";
import type { OrbStatus } from "@/components/VoiceOrb";

export type ConversationStatus = OrbStatus;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationReply {
  reply: string;
  done: boolean;
  summary: string | null;
}

interface SpeechRecognitionResultLike {
  0: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

const FATAL_SPEECH_ERRORS = new Set(["not-allowed", "audio-capture", "service-not-allowed"]);

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isVoiceConversationSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor()) && typeof window !== "undefined" && "speechSynthesis" in window;
}

interface UseVoiceConversationResult {
  status: ConversationStatus;
  error: string | null;
  messages: ConversationMessage[];
  start: () => void;
  stop: () => void;
}

export function useVoiceConversation(onDone: (summary: string) => void): UseVoiceConversationResult {
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const activeRef = useRef(false);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setStatus("ended");
  }, [cleanup]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || typeof window === "undefined" || !window.speechSynthesis) {
      setError("Live conversation needs Chrome or Edge with microphone access.");
      setStatus("error");
      return;
    }

    setError(null);
    setMessages([]);
    messagesRef.current = [];
    activeRef.current = true;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    const listenOnce = () => {
      if (!activeRef.current) return;
      setStatus("listening");
      recognition.start();
    };

    const handleUserTurn = async (transcript: string) => {
      const updated: ConversationMessage[] = [...messagesRef.current, { role: "user", content: transcript }];
      messagesRef.current = updated;
      setMessages(updated);
      setStatus("thinking");

      try {
        const res = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated }),
        });
        const data: ConversationReply = await res.json();

        const withReply: ConversationMessage[] = [...updated, { role: "assistant", content: data.reply }];
        messagesRef.current = withReply;
        setMessages(withReply);

        setStatus("speaking");
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.onend = () => {
          if (!activeRef.current) return;
          if (data.done) {
            const summary =
              data.summary ??
              withReply.map((m) => `${m.role === "user" ? "Patient" : "CarePath"}: ${m.content}`).join("\n");
            cleanup();
            setStatus("ended");
            onDone(summary);
          } else {
            listenOnce();
          }
        };
        utterance.onerror = utterance.onend;
        window.speechSynthesis.speak(utterance);
      } catch {
        setError("Conversation error — please try again.");
        setStatus("error");
        cleanup();
      }
    };

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript.trim();
      if (!transcript) {
        if (activeRef.current) listenOnce();
        return;
      }
      void handleUserTurn(transcript);
    };

    recognition.onerror = (event) => {
      if (!activeRef.current) return;
      if (FATAL_SPEECH_ERRORS.has(event.error)) {
        setError("Microphone access is blocked. Allow it in your browser settings and try again.");
        setStatus("error");
        cleanup();
        return;
      }
      listenOnce();
    };

    recognition.onend = null;

    setStatus("connecting");
    listenOnce();
  }, [cleanup, onDone]);

  return { status, error, messages, start, stop };
}
