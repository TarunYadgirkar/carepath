import type { CareLevel, Confidence } from "@/types/carepath";

export const CARE_LEVEL_LABELS: Record<CareLevel, string> = {
  self_monitor: "Self-Monitor at Home",
  telehealth: "Telehealth",
  primary_care: "Primary Care",
  urgent_care: "Urgent Care",
  emergency_room: "Emergency Room",
};

// Inline SVG icons — icon+label+color (never color alone; accessibility + 3-second rule)
export const CARE_LEVEL_ICONS: Record<CareLevel, string> = {
  self_monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  telehealth:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  primary_care: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  urgent_care:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  emergency_room:`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

// AA-contrast badge + ring classes — dark-mode variants included via CSS custom properties.
// Both light and dark values pull from the token ramp defined in globals.css.
export const CARE_LEVEL_STYLES: Record<CareLevel, { badge: string; ring: string }> = {
  self_monitor: {
    badge: [
      "bg-[var(--care-self-bg)] text-[var(--care-self-text)]",
      "border border-[var(--care-self-border)]",
    ].join(" "),
    ring: "ring-[var(--care-self-ring)]",
  },
  telehealth: {
    badge: [
      "bg-[var(--care-tele-bg)] text-[var(--care-tele-text)]",
      "border border-[var(--care-tele-border)]",
    ].join(" "),
    ring: "ring-[var(--care-tele-ring)]",
  },
  primary_care: {
    badge: [
      "bg-[var(--care-primary-bg)] text-[var(--care-primary-text)]",
      "border border-[var(--care-primary-border)]",
    ].join(" "),
    ring: "ring-[var(--care-primary-ring)]",
  },
  urgent_care: {
    badge: [
      "bg-[var(--care-urgent-bg)] text-[var(--care-urgent-text)]",
      "border border-[var(--care-urgent-border)]",
    ].join(" "),
    ring: "ring-[var(--care-urgent-ring)]",
  },
  emergency_room: {
    badge: [
      "bg-[var(--care-er-bg)] text-[var(--care-er-text)]",
      "border border-[var(--care-er-border)]",
    ].join(" "),
    ring: "ring-[var(--care-er-ring)]",
  },
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

// Visual weight scale: low = subtle outline, medium = soft fill, high = solid
export const CONFIDENCE_STYLES: Record<Confidence, string> = {
  low:    "border border-[var(--border-strong)] text-[var(--text-muted)] bg-transparent",
  medium: "bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border)]",
  high:   "bg-[var(--text-primary)] text-[var(--background)] border border-transparent",
};
