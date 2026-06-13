import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MAX_IMAGE_BASE64_LEN = 8 * 1024 * 1024; // ~8 MB base64

interface ScanLabelResult {
  medicationName: string;
  dosage: string;
  frequency: string;
  confidence: "low" | "medium" | "high";
}

function isValidScanResult(val: unknown): val is ScanLabelResult {
  if (typeof val !== "object" || val === null) return false;
  const v = val as Record<string, unknown>;
  return (
    typeof v.medicationName === "string" &&
    typeof v.dosage === "string" &&
    typeof v.frequency === "string" &&
    (v.confidence === "low" || v.confidence === "medium" || v.confidence === "high")
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const image: unknown = body?.image;

  if (
    typeof image !== "string" ||
    !image.startsWith("data:image/") ||
    image.length > MAX_IMAGE_BASE64_LEN
  ) {
    return NextResponse.json(
      { error: "image must be a data URL starting with 'data:image/' and under 8 MB" },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on this server" },
      { status: 503 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are a pill bottle label reader. Extract medication name, dosage, and frequency/instructions from the image. Return JSON: {"medicationName": string, "dosage": string, "frequency": string, "confidence": "low"|"medium"|"high"}. If the image is unreadable or not a medication label, set medicationName to "" and confidence to "low".`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Read this medication label." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });

    const text = response.choices[0].message.content ?? "";
    const parsed: unknown = JSON.parse(text);

    if (!isValidScanResult(parsed)) {
      throw new Error("Unexpected response shape from vision model");
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("scan-label error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Failed to extract label — please try again or enter manually" },
      { status: 502 }
    );
  }
}
