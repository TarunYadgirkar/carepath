import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const DISCLAIMER =
  "These are public Reddit communities, not medical sources. People share personal experiences that may be inaccurate or unverified. Always confirm anything you read with a licensed clinician.";

const MAX_SUMMARY_LENGTH = 4000;
const MAX_COMMUNITIES = 5;
const ARCTIC_SHIFT_TIMEOUT_MS = 5_000;
const VALID_NAME = /^[A-Za-z0-9_]+$/;

interface Community {
  name: string;
  title: string;
  subscribers: number | null;
  description: string;
  why: string;
  url: string;
}

interface ArcticShiftSubreddit {
  display_name?: string;
  title?: string;
  subscribers?: number;
  public_description?: string;
}

interface LlmCandidate {
  name: string;
  why: string;
}

function buildSystemPrompt(): string {
  return `You are CarePath Communities, a helper that suggests real, established Reddit support communities where patients with given symptoms can read others' experiences.

Given a patient's symptom summary (and optional risk signals), suggest 3-5 RELEVANT, REAL patient/condition support subreddits.

RULES:
- Favor well-known, established health/condition communities (e.g. migraine, ChronicPain, AskDocs, type1diabetes, ibs, Asthma, multiplesclerosis, POTS, Anxiety, depression).
- Names must be PLAUSIBLE REAL subreddits. Do NOT invent obviously-fake names.
- Return the subreddit name WITHOUT the "r/" prefix.
- Each "why" is ONE patient-friendly sentence explaining why this community may be relevant to the symptoms.

Return a JSON object with exactly this structure:
{
  "communities": [
    { "name": "<subreddit without r/>", "why": "<one patient-friendly sentence>" }
  ]
}`;
}

function parseCandidates(text: string): LlmCandidate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }

  if (typeof parsed !== "object" || parsed === null || !("communities" in parsed)) {
    return [];
  }

  const raw = (parsed as { communities: unknown }).communities;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (c): c is { name: unknown; why: unknown } =>
        typeof c === "object" && c !== null && "name" in c
    )
    .map((c) => ({
      name: typeof c.name === "string" ? c.name.trim().replace(/^r\//i, "") : "",
      why: typeof c.why === "string" ? c.why.trim() : "",
    }))
    .filter((c) => c.name.length > 0 && VALID_NAME.test(c.name))
    .slice(0, MAX_COMMUNITIES);
}

async function enrich(candidate: LlmCandidate): Promise<Community> {
  const base: Community = {
    name: candidate.name,
    title: "",
    subscribers: null,
    description: "",
    why: candidate.why,
    url: `https://www.reddit.com/r/${candidate.name}/`,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ARCTIC_SHIFT_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://arctic-shift.photon-reddit.com/api/subreddits/search?subreddit=${encodeURIComponent(
        candidate.name
      )}&limit=1`,
      { signal: controller.signal }
    );

    if (!res.ok) {
      return base;
    }

    const json: unknown = await res.json();
    const data =
      typeof json === "object" && json !== null && "data" in json
        ? (json as { data: unknown }).data
        : null;

    if (!Array.isArray(data) || data.length === 0) {
      return base;
    }

    const hit = data[0] as ArcticShiftSubreddit;
    const matches =
      typeof hit.display_name === "string" &&
      hit.display_name.toLowerCase() === candidate.name.toLowerCase();

    if (!matches) {
      return base;
    }

    return {
      ...base,
      title: typeof hit.title === "string" ? hit.title : "",
      subscribers: typeof hit.subscribers === "number" ? hit.subscribers : null,
      description:
        typeof hit.public_description === "string" ? hit.public_description : "",
    };
  } catch {
    return base;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const summary: unknown = body?.summary;
  const rawSignals: unknown = body?.signals;

  if (typeof summary !== "string" || summary.trim().length === 0) {
    return NextResponse.json(
      { error: "summary must be a non-empty string" },
      { status: 400 }
    );
  }

  if (summary.length > MAX_SUMMARY_LENGTH) {
    return NextResponse.json(
      { error: `summary must be at most ${MAX_SUMMARY_LENGTH} characters` },
      { status: 400 }
    );
  }

  const signals: string[] = Array.isArray(rawSignals)
    ? rawSignals.filter((s): s is string => typeof s === "string")
    : [];

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ communities: [], disclaimer: DISCLAIMER });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15_000,
      maxRetries: 1,
    });

    const userContent = signals.length
      ? `Symptom summary:\n${summary}\n\nRisk signals:\n- ${signals.join("\n- ")}`
      : `Symptom summary:\n${summary}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 600,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userContent },
      ],
    });

    const text = response.choices[0].message.content ?? "";
    const candidates = parseCandidates(text);

    if (candidates.length === 0) {
      return NextResponse.json({ communities: [], disclaimer: DISCLAIMER });
    }

    const communities = await Promise.all(candidates.map(enrich));

    return NextResponse.json({ communities, disclaimer: DISCLAIMER });
  } catch (err) {
    console.error(
      "Communities error — returning empty list:",
      err instanceof Error ? err.message : "unknown"
    );
    return NextResponse.json({ communities: [], disclaimer: DISCLAIMER });
  }
}
