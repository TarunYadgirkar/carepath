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
// Maximum number of distinct keys to keep in memory. If exceeded, expired
// entries are swept first; if still over, the oldest half is evicted.
const MAX_STORE_KEYS = 10_000;

function getLimit(pathname: string): number {
  if (pathname.startsWith("/api/realtime-token")) return 30;
  if (pathname.startsWith("/api/tts")) return 120;
  // classify, conversation, scan-label share a combined budget
  return 60;
}

function sweepExpired(now: number): void {
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= WINDOW_MS) {
      store.delete(key);
    }
  }
}

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // Entry expired or missing — evict it before inserting to keep map bounded.
    if (entry) store.delete(key);

    if (store.size >= MAX_STORE_KEYS) {
      sweepExpired(now);
      // If still over capacity after sweeping expired entries, drop the oldest half.
      if (store.size >= MAX_STORE_KEYS) {
        let toDrop = Math.floor(store.size / 2);
        for (const k of store.keys()) {
          store.delete(k);
          if (--toDrop === 0) break;
        }
      }
    }

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
