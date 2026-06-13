import { NextResponse } from "next/server";
import { CAREPATH_VOICE_SETTINGS } from "@/data/voice-settings";

const GROK_REALTIME_MODEL = CAREPATH_VOICE_SETTINGS.realtimeModel;

export async function POST() {
  if (!process.env.XAI_API_KEY) {
    return NextResponse.json(
      { error: "XAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.x.ai/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROK_REALTIME_MODEL,
      voice: CAREPATH_VOICE_SETTINGS.realtimeVoice,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: "Failed to create Grok Voice session", detail },
      { status: 502 }
    );
  }

  const data = await response.json();
  const token = data.client_secret?.value ?? data.token;

  if (!token) {
    return NextResponse.json(
      { error: "Grok Voice session response missing token" },
      { status: 502 }
    );
  }

  return NextResponse.json({ token, model: GROK_REALTIME_MODEL });
}
