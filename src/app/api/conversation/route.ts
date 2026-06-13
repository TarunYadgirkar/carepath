import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationReply {
  reply: string;
  done: boolean;
  summary: string | null;
}

const GREETING: ConversationReply = {
  reply: "Hi, I'm CarePath. What's going on today, and how long has it been happening?",
  done: false,
  summary: null,
};

const FALLBACK_REPLY: ConversationReply = {
  reply: "Voice conversation isn't available right now — please use the demo conversation instead.",
  done: true,
  summary: null,
};

const SYSTEM_PROMPT = `You are CarePath, a calm voice intake assistant having a short spoken conversation with a patient.

Ask short, plain-language questions one at a time to learn:
- Their main symptom and how long they've had it
- Whether they have any red-flag symptoms (trouble breathing, chest pain, confusion, severe bleeding, loss of consciousness)
- Current medications and allergies
- Insurance plan and remaining deductible, if known

Keep each reply to 1-2 short sentences — it will be spoken aloud.

Once you have enough information (usually after 3-5 patient replies), OR if the patient describes a clear emergency, stop asking questions. Set "done" to true, and write "summary" as a clean transcript-style record of the conversation so far (alternating "Patient:" / "CarePath:" lines) for a downstream care-navigation classifier.

You are a navigation tool, not a diagnosis system — never diagnose. If the patient describes a clear emergency, tell them to call 911 immediately, and still set done=true with a summary.

Respond with JSON only: {"reply": "your next spoken reply", "done": boolean, "summary": "transcript-style summary, or null if not done"}`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const messages: ConversationMessage[] | undefined = body?.messages;

  if (!messages || messages.length === 0) {
    return NextResponse.json(GREETING);
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
        { role: "system", content: SYSTEM_PROMPT },
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
