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
      className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-transform duration-150 hover:scale-105 active:scale-95"
    >
      Share Care Card
    </button>
  );
}
