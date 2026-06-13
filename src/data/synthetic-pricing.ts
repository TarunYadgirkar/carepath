// src/data/synthetic-pricing.ts
// SYNTHETIC DATA ONLY — no real insurance API calls.
// This file is the single source of truth for all cost estimates in CarePath.

export interface InsurancePlan {
  name: string;
  deductibleRemaining: number;
  telehealthCopay: number;
  pcpCopay: number;
  urgentCareCopay: number;
  erCopay: number;
  coinsuranceAfterDeductible: number; // e.g. 0.2 = 20% patient pays after deductible
}

export interface BaseCostRange {
  min: number;
  max: number;
}

export interface SyntheticPricingData {
  plans: Record<string, InsurancePlan>;
  baseCosts: {
    telehealth: BaseCostRange;
    primary_care: BaseCostRange;
    urgent_care: BaseCostRange;
    emergency_room: BaseCostRange;
  };
}

export const syntheticPricing: SyntheticPricingData = {
  plans: {
    "BlueShield Silver PPO": {
      name: "BlueShield Silver PPO (synthetic)",
      deductibleRemaining: 420,
      telehealthCopay: 20,
      pcpCopay: 35,
      urgentCareCopay: 85,
      erCopay: 350,
      coinsuranceAfterDeductible: 0.2,
    },
  },
  baseCosts: {
    telehealth: { min: 20, max: 40 },
    primary_care: { min: 35, max: 120 },
    urgent_care: { min: 85, max: 180 },
    emergency_room: { min: 650, max: 1200 },
  },
};

// Default plan used when no plan is specified in voice conversation
export const DEFAULT_PLAN_KEY = "BlueShield Silver PPO";

/**
 * Returns a human-readable cost estimate string for a given care type.
 * Uses the patient's copay if their deductible is met, otherwise estimates from base costs.
 */
export function estimateCost(
  careType: keyof SyntheticPricingData["baseCosts"],
  planKey: string = DEFAULT_PLAN_KEY
): string {
  const plan = syntheticPricing.plans[planKey];
  const base = syntheticPricing.baseCosts[careType];

  if (!plan) {
    return `$${base.min}–$${base.max} (uninsured estimate)`;
  }

  switch (careType) {
    case "telehealth":
      return `$${plan.telehealthCopay} copay`;
    case "primary_care":
      return `$${plan.pcpCopay} copay`;
    case "urgent_care":
      return `$${plan.urgentCareCopay}–$${Math.round(
        plan.urgentCareCopay + base.max * plan.coinsuranceAfterDeductible
      )}`;
    case "emergency_room":
      return `$${plan.erCopay}–$${base.max}`;
    default:
      return `$${base.min}–$${base.max}`;
  }
}
