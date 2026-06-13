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

  const response = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    // No model here — model goes in the WebSocket URL, not the token request
    body: JSON.stringify({ expires_after: { seconds: 300 } }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: "Failed to create Grok Voice session", detail },
      { status: 502 }
    );
  }

  const data = await response.json();
  const token = data.value;

  if (!token) {
    return NextResponse.json(
      { error: "Grok Voice session response missing token" },
      { status: 502 }
    );
  }

  return NextResponse.json({ token, model: GROK_REALTIME_MODEL });
}
