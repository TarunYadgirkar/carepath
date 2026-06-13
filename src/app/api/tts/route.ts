import { NextRequest, NextResponse } from "next/server";
import { CAREPATH_VOICE_SETTINGS } from "@/data/voice-settings";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text: string | undefined = body?.text;

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({ error: "XAI_API_KEY is not configured" }, { status: 500 });
  }

  const voiceId = body?.voice_id ?? CAREPATH_VOICE_SETTINGS.ttsVoiceId;
  const language = body?.language ?? CAREPATH_VOICE_SETTINGS.ttsLanguage;

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
    return NextResponse.json({ error: "Grok TTS request failed", detail }, { status: 502 });
  }

  const audio = await response.arrayBuffer();
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
