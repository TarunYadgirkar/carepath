import type { CarePathResult } from "@/types/carepath";

const STORAGE_KEY = "carepath:result";

export function saveCareResult(result: CarePathResult): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadCareResult(): CarePathResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CarePathResult;
  } catch {
    return null;
  }
}
