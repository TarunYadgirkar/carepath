import type { CareLevel, Confidence } from "@/types/carepath";

export const CARE_LEVEL_LABELS: Record<CareLevel, string> = {
  self_monitor: "Self-Monitor at Home",
  telehealth: "Telehealth",
  primary_care: "Primary Care",
  urgent_care: "Urgent Care",
  emergency_room: "Emergency Room",
};

// Tailwind classes per care level — accent color scales with urgency.
export const CARE_LEVEL_STYLES: Record<CareLevel, { badge: string; ring: string }> = {
  self_monitor: { badge: "bg-emerald-100 text-emerald-900", ring: "ring-emerald-500" },
  telehealth: { badge: "bg-sky-100 text-sky-900", ring: "ring-sky-500" },
  primary_care: { badge: "bg-indigo-100 text-indigo-900", ring: "ring-indigo-500" },
  urgent_care: { badge: "bg-amber-100 text-amber-900", ring: "ring-amber-500" },
  emergency_room: { badge: "bg-red-100 text-red-900", ring: "ring-red-500" },
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

export const CONFIDENCE_STYLES: Record<Confidence, string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-zinc-200 text-zinc-700",
  high: "bg-zinc-900 text-zinc-50",
};
