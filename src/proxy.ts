import { NextRequest, NextResponse } from "next/server";

// Best-effort in-process rate limiter using a fixed-window algorithm.
// State is per-instance and resets on serverless cold start — not shared across
// concurrent instances. For production multi-instance deployments, replace with
// Upstash Redis (upstash/ratelimit) so limits are enforced globally.
//
// Limits are intentionally generous so a live demo (repeated voice restarts,
// chatty conversations, venue NAT sharing one IP) never trips them. Set the
// env var DISABLE_RATE_LIMIT=1 in the deploy to bypass entirely for demo day.

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();
const WINDOW_MS = 60_000;

function getLimit(pathname: string): number {
  if (pathname.startsWith("/api/realtime-token")) return 30;
  if (pathname.startsWith("/api/tts")) return 120;
  // classify, conversation, scan-label share a combined budget
  return 60;
}

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= limit) return true;

  store.set(key, { count: entry.count + 1, windowStart: entry.windowStart });
  return false;
}

export function proxy(req: NextRequest) {
  if (process.env.DISABLE_RATE_LIMIT === "1") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = getLimit(pathname);
  const key = `${ip}:${pathname.split("/")[2] ?? "api"}`;

  if (isRateLimited(key, limit)) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment and try again." },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
