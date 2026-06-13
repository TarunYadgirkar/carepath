import { NextRequest, NextResponse } from "next/server";
import { CAREPATH_VOICE_SETTINGS } from "@/data/voice-settings";

const MAX_TEXT_LENGTH = 1000;

const ALLOWED_VOICE_IDS = new Set<string>([CAREPATH_VOICE_SETTINGS.ttsVoiceId]);
const ALLOWED_LANGUAGES = new Set<string>([CAREPATH_VOICE_SETTINGS.ttsLanguage]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text: string | undefined = body?.text;

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "text exceeds maximum length" }, { status: 400 });
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({ error: "XAI_API_KEY is not configured" }, { status: 500 });
  }

  const requestedVoiceId = body?.voice_id;
  const requestedLanguage = body?.language;

  const voiceId = typeof requestedVoiceId === "string" && ALLOWED_VOICE_IDS.has(requestedVoiceId)
    ? requestedVoiceId
    : CAREPATH_VOICE_SETTINGS.ttsVoiceId;

  const language = typeof requestedLanguage === "string" && ALLOWED_LANGUAGES.has(requestedLanguage)
    ? requestedLanguage
    : CAREPATH_VOICE_SETTINGS.ttsLanguage;

  const response = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voice_id: voiceId, language }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("TTS upstream error:", response.status, detail);
    return NextResponse.json(
      { error: "Voice service temporarily unavailable" },
      { status: 502 }
    );
  }

  const audio = await response.arrayBuffer();
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
