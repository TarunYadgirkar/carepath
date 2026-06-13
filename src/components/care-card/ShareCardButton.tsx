"use client";

import { useRouter } from "next/navigation";
import type { CarePathResult } from "@/types/carepath";
import { saveSharedCareResult } from "@/lib/care-result-storage";

export function ShareCardButton({ result }: { result: CarePathResult }) {
  const router = useRouter();

  const handleShare = () => {
    const id = crypto.randomUUID();
    saveSharedCareResult(id, result);
    router.push(`/card/${id}`);
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Share your Care Card"
      className="flex min-h-[44px] items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
      style={{
        background: "var(--accent)",
        color: "var(--accent-contrast)",
        boxShadow: "var(--shadow-sm)",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-expo)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <svg
        aria-hidden="true"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      Share Care Card
    </button>
  );
}
