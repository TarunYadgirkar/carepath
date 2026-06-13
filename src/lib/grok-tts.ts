import { CAREPATH_VOICE_SETTINGS } from "@/data/voice-settings";

let activeAudio: HTMLAudioElement | null = null;

export function stopGrokTts(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
  }
}

function speakBrowserFallback(text: string, onEnd: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

/** Speak text via Grok TTS (/api/tts), falling back to browser speechSynthesis. */
export async function speakGrokTts(text: string, onEnd: () => void): Promise<void> {
  stopGrokTts();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice_id: CAREPATH_VOICE_SETTINGS.ttsVoiceId,
        language: CAREPATH_VOICE_SETTINGS.ttsLanguage,
      }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudio = audio;

      const finish = () => {
        URL.revokeObjectURL(url);
        if (activeAudio === audio) activeAudio = null;
        onEnd();
      };

      audio.onended = finish;
      audio.onerror = finish;
      await audio.play();
      return;
    }
  } catch {
    // fall through to browser TTS
  }

  speakBrowserFallback(text, onEnd);
}
