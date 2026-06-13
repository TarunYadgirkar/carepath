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

export function clearCareResult(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function sharedCardKey(id: string): string {
  return `carepath-card-${id}`;
}

export function saveSharedCareResult(id: string, result: CarePathResult): void {
  localStorage.setItem(sharedCardKey(id), JSON.stringify(result));
}

export function loadSharedCareResult(id: string): CarePathResult | null {
  const raw = localStorage.getItem(sharedCardKey(id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CarePathResult;
  } catch {
    return null;
  }
}
