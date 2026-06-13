"use client";

import { useCallback, useRef, useState } from "react";
import type { OrbStatus } from "@/components/VoiceOrb";
import { speakGrokTts, stopGrokTts } from "@/lib/grok-tts";
import { buildEpicContext, getEpicImport } from "@/lib/epic-import";
import { buildMedCardContext, getMedCard } from "@/lib/medcard";
import { buildSymptomLogContext, getSymptomLog } from "@/lib/symptom-log";
import type { ConversationMode } from "@/lib/mode-prompts";

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
  isFinal: boolean;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
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
  return Boolean(getSpeechRecognitionCtor());
}

interface UseVoiceConversationResult {
  status: ConversationStatus;
  error: string | null;
  messages: ConversationMessage[];
  interimTranscript: string;
  speakingText: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  muted: boolean;
  toggleMute: () => void;
}

export function useVoiceConversation(
  onDone: (summary: string) => void,
  mode: ConversationMode = "triage"
): UseVoiceConversationResult {
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const activeRef = useRef(false);
  const turnHandledRef = useRef(false);
  const listeningRef = useRef(false);
  const mutedRef = useRef(false);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    listeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopGrokTts();
    setSpeakingText(null);
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
    setInterimTranscript("");
    setSpeakingText(null);
    messagesRef.current = [];
    turnHandledRef.current = false;
    listeningRef.current = false;
  }, [cleanup]);

  const listenOnce = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!activeRef.current || !recognition) return;
    if (mutedRef.current) {
      listeningRef.current = false;
      return;
    }
    turnHandledRef.current = false;
    listeningRef.current = true;
    setInterimTranscript("");
    setStatus("listening");
    try {
      recognition.start();
    } catch {
      // recognition may already be running
    }
  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) {
      listeningRef.current = false;
      recognitionRef.current?.stop();
    } else if (activeRef.current) {
      listenOnce();
    }
  }, [listenOnce]);

  const speakAndContinue = useCallback(
    async (reply: string, done: boolean, summary: string | null, currentMessages: ConversationMessage[]) => {
      listeningRef.current = false;
      setSpeakingText(reply);
      setStatus("speaking");

      await speakGrokTts(reply, () => {
        if (!activeRef.current) return;
        setSpeakingText(null);

        if (done) {
          const finalSummary =
            summary ??
            currentMessages.map((m) => `${m.role === "user" ? "Patient" : "CarePath"}: ${m.content}`).join("\n");
          cleanup();
          setStatus("ended");
          onDone(finalSummary);
        } else {
          listenOnce();
        }
      });
    },
    [cleanup, listenOnce, onDone]
  );

  const handleAssistantReply = useCallback(
    async (data: ConversationReply, currentMessages: ConversationMessage[]) => {
      const withReply: ConversationMessage[] = [
        ...currentMessages,
        { role: "assistant", content: data.reply },
      ];
      messagesRef.current = withReply;
      setMessages(withReply);
      await speakAndContinue(data.reply, data.done, data.summary, withReply);
    },
    [speakAndContinue]
  );

  const handleUserTurn = useCallback(
    async (transcript: string) => {
      turnHandledRef.current = true;
      listeningRef.current = false;
      setInterimTranscript("");
      const updated: ConversationMessage[] = [
        ...messagesRef.current,
        { role: "user", content: transcript },
      ];
      messagesRef.current = updated;
      setMessages(updated);
      setStatus("thinking");

      try {
        const res = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated,
            mode,
            medContext:
              buildMedCardContext(getMedCard()) +
              buildEpicContext(getEpicImport()) +
              buildSymptomLogContext(getSymptomLog()),
          }),
        });
        const data: ConversationReply = await res.json();
        await handleAssistantReply(data, updated);
      } catch {
        setError("Conversation error — please try again.");
        setStatus("error");
        cleanup();
      }
    },
    [cleanup, handleAssistantReply, mode]
  );

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || typeof window === "undefined") {
      setError("Live conversation needs Chrome or Edge with microphone access.");
      setStatus("error");
      return;
    }

    setError(null);
    setMessages([]);
    setInterimTranscript("");
    setSpeakingText(null);
    messagesRef.current = [];
    activeRef.current = true;
    turnHandledRef.current = false;
    listeningRef.current = false;
    mutedRef.current = false;
    setMuted(false);

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript.trim()) {
        void handleUserTurn(finalTranscript.trim());
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event) => {
      if (!activeRef.current) return;
      if (FATAL_SPEECH_ERRORS.has(event.error)) {
        setError("Microphone access is blocked. Allow it in your browser settings and try again.");
        setStatus("error");
        cleanup();
      }
    };

    recognition.onend = () => {
      if (activeRef.current && listeningRef.current && !turnHandledRef.current) {
        listenOnce();
      }
    };

    const beginWithGreeting = async () => {
      setStatus("connecting");
      try {
        const res = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], mode }),
        });
        const greeting: ConversationReply = await res.json();
        const greetingMessages: ConversationMessage[] = [
          { role: "assistant", content: greeting.reply },
        ];
        messagesRef.current = greetingMessages;
        setMessages(greetingMessages);
        await speakAndContinue(greeting.reply, false, null, greetingMessages);
      } catch {
        setError("Could not start conversation — please try again.");
        setStatus("error");
        cleanup();
      }
    };

    void beginWithGreeting();
  }, [cleanup, handleUserTurn, listenOnce, speakAndContinue, mode]);

  return { status, error, messages, interimTranscript, speakingText, start, stop, reset, muted, toggleMute };
}
