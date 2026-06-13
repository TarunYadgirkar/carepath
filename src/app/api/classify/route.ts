import { NextResponse } from "next/server";
import { mockCarePathResult } from "@/types/carepath";

// Phase 0 stub: always returns the Maya Patel mock result so the fallback
// demo flow is end-to-end testable before the real OpenAI classifier
// (Phase 1, see .claude/skills/care-classifier/SKILL.md) is wired up.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.transcript || typeof body.transcript !== "string") {
    return NextResponse.json(
      { error: "Request body must include a transcript string" },
      { status: 400 }
    );
  }

  return NextResponse.json(mockCarePathResult);
}
