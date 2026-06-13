---
name: grok-voice
description: Integrate Grok Voice (xAI Realtime API) for real-time speech-to-speech in a Next.js browser app. Load this skill when working on the voice conversation screen, WebSocket connection, ephemeral token flow, audio capture, or transcript display. Also load when debugging any voice pipeline issue.
---

# Grok Voice Integration

Grok Voice is the xAI real-time speech-to-speech API. It is **fully compatible with the OpenAI Realtime API** — same WebSocket protocol, same message format. Only the base URL changes.

- **WebSocket URL:** `wss://api.x.ai/v1/realtime`
- **Voices:** Ara, Eve, Leo (confirm available voices at check-in)
- **Latency:** Sub-second time-to-first-audio
- **Built-in tools:** `web_search`, `x_search`, custom functions

---

## Ephemeral Token Flow (Security Pattern)

Never expose `XAI_API_KEY` to the client. Use server-issued ephemeral tokens:

1. Client calls `POST /api/realtime-token` (your Next.js server)
2. Server calls xAI with `XAI_API_KEY` → gets a short-lived client token
3. Client opens WebSocket using that token

### Server: /app/api/realtime-token/route.ts

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = await fetch("https://api.x.ai/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "grok-2-realtime", voice: "Eve" }),
  });

  const data = await response.json();
  return NextResponse.json({ token: data.client_secret?.value ?? data.token });
}
```

### Client: WebSocket connection

```typescript
const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
const { token } = await tokenRes.json();

const ws = new WebSocket(
  "wss://api.x.ai/v1/realtime?model=grok-2-realtime",
  ["realtime", `openai-insecure-api-key.${token}`, "openai-beta.realtime-v1"]
);

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      modalities: ["text", "audio"],
      instructions: YOUR_SYSTEM_PROMPT,
      voice: "Eve",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        silence_duration_ms: 500,
      },
    },
  }));
};
```

---

## Audio Capture (PCM16 from Mic)

```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const audioContext = new AudioContext({ sampleRate: 24000 });
const source = audioContext.createMediaStreamSource(stream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

processor.onaudioprocess = (e) => {
  const inputData = e.inputBuffer.getChannelData(0);
  const pcm16 = new Int16Array(inputData.length);
  for (let i = 0; i < inputData.length; i++) {
    const s = Math.max(-1, Math.min(1, inputData[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
  ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64 }));
};

source.connect(processor);
processor.connect(audioContext.destination);
```

---

## Key Message Types

| Type | Action |
|---|---|
| `response.audio.delta` | Play audio chunk |
| `response.audio_transcript.delta` | Show AI words on screen |
| `conversation.item.input_audio_transcription.completed` | Show patient words on screen |
| `response.function_call_arguments.done` | Handle tool call (e.g. end_consultation) |
| `error` | Log + fall back to demo mode |

---

## Fallback Demo Mode

Build this first. Set `DEMO_MODE = true` to bypass live voice:

```typescript
import { DEMO_TRANSCRIPT } from "@/mocks/demo-transcript";

if (DEMO_MODE) {
  await new Promise(r => setTimeout(r, 2000)); // simulate conversation delay
  await classifyAndNavigate(DEMO_TRANSCRIPT);
}
```

---

## Common Issues

| Issue | Fix |
|---|---|
| 401 on WebSocket | Ephemeral token expired — request new one |
| No audio output | AudioContext must be resumed after user gesture |
| Model string error | Confirm exact model name with xAI at hackathon check-in |
| Mic not starting | Check `getUserMedia` permissions — must be HTTPS or localhost |
