import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CONVERSATION_SYSTEM_PROMPTS, GREETINGS, type ConversationMode } from "@/lib/mode-prompts";

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
  const body = await req.json().catch(() => null);
  const messages: ConversationMessage[] | undefined = body?.messages;
  const mode: ConversationMode = body?.mode ?? "triage";
  const medContext: string = body?.medContext ?? "";

  if (!messages || messages.length === 0) {
    return NextResponse.json({ reply: GREETINGS[mode], done: false, summary: null });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(FALLBACK_REPLY);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 400,
      messages: [
        { role: "system", content: CONVERSATION_SYSTEM_PROMPTS[mode] + medContext },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
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
    console.error("Conversation error — returning fallback:", err);
    return NextResponse.json(FALLBACK_REPLY);
  }
}
