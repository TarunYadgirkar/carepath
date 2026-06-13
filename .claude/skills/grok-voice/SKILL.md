# Skill: Grok Voice Integration

Use this skill when implementing or debugging the voice conversation screen, WebSocket connection, ephemeral token flow, or audio pipeline.

---

## What Grok Voice Is

Grok Voice is xAI's real-time speech-to-speech API. It is **fully compatible with the OpenAI Realtime API** — the WebSocket protocol, message format, and session management are identical. The only difference is the base URL.

- **WebSocket URL:** `wss://api.x.ai/v1/realtime`
- **OpenAI equivalent:** `wss://api.openai.com/v1/realtime`
- **Voices:** Ara, Eve, Leo (and others — confirm at check-in with xAI credits)
- **Latency:** Sub-second time-to-first-audio
- **Built-in tools:** `web_search`, `x_search`, custom function calling

---

## Architecture: Ephemeral Token Flow

Never expose `XAI_API_KEY` to the client. Use ephemeral tokens:

```
Client                          Server (/api/realtime-token)         xAI
  |                                      |                              |
  |-- POST /api/realtime-token -------->|                              |
  |                                      |-- request ephemeral token ->|
  |                                      |<-- { token, expires_at } --|
  |<-- { token } ----------------------|                              |
  |                                      |                              |
  |-- WebSocket wss://api.x.ai/... ------------------------------------------->|
  |   (Authorization: Bearer {token})                                  |
```

### Server route: /app/api/realtime-token/route.ts

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = await fetch("https://api.x.ai/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2-realtime",  // confirm model name at event — may differ
      voice: "Eve",
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ token: data.client_secret?.value ?? data.token });
}
```

---

## Client-Side WebSocket Connection

```typescript
// In your React component (intake/page.tsx)
const connectGrokVoice = async () => {
  // Step 1: Get ephemeral token from your server
  const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
  const { token } = await tokenRes.json();

  // Step 2: Open WebSocket with token
  const ws = new WebSocket(
    `wss://api.x.ai/v1/realtime?model=grok-2-realtime`,
    ["realtime", `openai-insecure-api-key.${token}`, "openai-beta.realtime-v1"]
  );

  ws.onopen = () => {
    // Step 3: Configure the session
    ws.send(JSON.stringify({
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: CAREPATH_SYSTEM_PROMPT, // see care-classifier SKILL.md
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
            description: "Call this when you have gathered enough information to generate a care recommendation. Signal that the conversation is complete.",
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
    }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleGrokMessage(msg); // route to your message handler
  };

  return ws;
};
```

---

## Audio Setup

Use `getUserMedia` + `AudioContext` to capture mic audio and stream PCM16 to the WebSocket.

```typescript
const startAudioCapture = async (ws: WebSocket) => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext({ sampleRate: 24000 });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (e) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const inputData = e.inputBuffer.getChannelData(0);
    const pcm16 = floatTo16BitPCM(inputData);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
    ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64 }));
  };

  source.connect(processor);
  processor.connect(audioContext.destination);
  return { stream, audioContext, processor };
};

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const output = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}
```

---

## Key Message Types to Handle

```typescript
const handleGrokMessage = (msg: any) => {
  switch (msg.type) {
    case "response.audio.delta":
      // Play audio chunk — append to audio queue
      playAudioChunk(msg.delta);
      break;

    case "response.audio_transcript.delta":
      // Append AI transcript text to screen
      setAiTranscript(prev => prev + msg.delta);
      break;

    case "conversation.item.input_audio_transcription.completed":
      // Patient's words — append to patient transcript
      setPatientTranscript(prev => prev + "\n" + msg.transcript);
      break;

    case "response.function_call_arguments.done":
      // end_consultation tool was called — time to classify
      if (msg.name === "end_consultation") {
        handleEndConsultation(fullTranscript);
      }
      break;

    case "error":
      console.error("Grok Voice error:", msg.error);
      // Fall back to demo mode if critical error
      break;
  }
};
```

---

## Fallback Demo Mode

Build this BEFORE polishing the live voice pipeline. If anything breaks during the demo:

```typescript
const DEMO_MODE = true; // flip to true to bypass live voice

if (DEMO_MODE) {
  // Simulate conversation with preloaded transcript
  import { DEMO_TRANSCRIPT } from "@/mocks/demo-transcript";
  // Show transcript on screen with a slight delay for realism
  // Then call /api/classify with DEMO_TRANSCRIPT
  await new Promise(r => setTimeout(r, 2000));
  await classifyAndNavigate(DEMO_TRANSCRIPT);
}
```

---

## Common Issues

| Issue | Fix |
|---|---|
| WebSocket 401 | Ephemeral token expired (they're short-lived). Request a new one. |
| No audio output | Check AudioContext state — must be resumed after user gesture |
| Transcript not appearing | Check `conversation.item.input_audio_transcription.completed` event |
| Model string error | Confirm exact model name with xAI at check-in — may not be `grok-2-realtime` |
| CORS error on token endpoint | Ensure token fetch is to your own Next.js API route, not directly to xAI |
