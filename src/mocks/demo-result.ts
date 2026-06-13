// src/mocks/demo-result.ts
// Pre-computed CarePathResult for Maya Patel — the classifier fallback.
// Used when: (1) /api/classify parse fails, (2) fallback demo mode is active.
// Import mockCarePathResult from src/types/carepath.ts — it is defined there
// as part of the frozen schema so types stay in sync automatically.

export { mockCarePathResult as DEMO_RESULT } from "../types/carepath";
