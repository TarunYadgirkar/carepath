/** CarePath voice agent settings — shared by TTS and (future) Realtime paths. */
export const CAREPATH_VOICE_SETTINGS = {
  /** xAI TTS voice_id — confirmed working via POST /v1/tts */
  ttsVoiceId: "eve",
  ttsLanguage: "en",
  /** Display label for the intake UI */
  voiceLabel: "Eve (Grok Voice)",
  /** Realtime Voice Agent model — used when /v1/realtime/sessions is enabled on the account */
  realtimeModel: "grok-voice-think-fast-1.0",
  realtimeVoice: "Eve",
} as const;
