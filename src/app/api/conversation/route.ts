import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CONVERSATION_SYSTEM_PROMPTS, GREETINGS, type ConversationMode } from "@/lib/mode-prompts";

const VALID_MODES = new Set<ConversationMode>(["triage", "debrief", "medcard", "signal"]);
const MAX_MESSAGES = 60;
const MAX_MESSAGE_CONTENT = 8000;
const MAX_MED_CONTEXT = 4000;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationReply {
  reply: string;
  done: boolean;
  summary: string | null;
}

const FALLBACK_REPLY: ConversationReply = {
  reply: "Voice conversation isn't available right now — please use the demo conversation instead.",
  done: true,
  summary: null,
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  const mode = raw.mode ?? "triage";
  if (typeof mode !== "string" || !VALID_MODES.has(mode as ConversationMode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  const validMode = mode as ConversationMode;

  const messages = raw.messages;
  if (messages !== undefined) {
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
    }
    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: "Too many messages" }, { status: 400 });
    }
    for (const m of messages) {
      if (!m || typeof m !== "object") {
        return NextResponse.json({ error: "Invalid message" }, { status: 400 });
      }
      const msg = m as Record<string, unknown>;
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json({ error: "Invalid message role" }, { status: 400 });
      }
      if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_CONTENT) {
        return NextResponse.json({ error: "Message content too long or invalid" }, { status: 400 });
      }
    }
  }

  const typedMessages = messages as ConversationMessage[] | undefined;

  if (!typedMessages || typedMessages.length === 0) {
    return NextResponse.json({ reply: GREETINGS[validMode], done: false, summary: null });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(FALLBACK_REPLY);
  }

  const rawMedContext = typeof raw.medContext === "string" ? raw.medContext : "";
  const medContext = rawMedContext.slice(0, MAX_MED_CONTEXT);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 400,
      messages: [
        { role: "system", content: CONVERSATION_SYSTEM_PROMPTS[validMode] + medContext },
        ...typedMessages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const text = response.choices[0].message.content ?? "";
    const result = JSON.parse(text);

    if (typeof result.reply !== "string") {
      throw new Error("Invalid conversation response shape");
    }

    const reply: ConversationReply = {
      reply: result.reply,
      done: Boolean(result.done),
      summary: typeof result.summary === "string" ? result.summary : null,
    };
    return NextResponse.json(reply);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Conversation error:", message);
    return NextResponse.json(FALLBACK_REPLY);
  }
}
