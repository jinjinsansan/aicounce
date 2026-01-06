export type PlanSlug = "basic" | "premium";

type PlanDefinition = {
  id: PlanSlug;
  label: string;
  description: string;
  priceYen: number;
  paypalPlanId?: string;
};

const PAYPAL_BASIC_PLAN_ID = process.env.PAYPAL_BASIC_PLAN_ID;
const PAYPAL_PREMIUM_PLAN_ID = process.env.PAYPAL_PREMIUM_PLAN_ID;

export const PLAN_DEFINITIONS: Record<PlanSlug, PlanDefinition> = {
  basic: {
    id: "basic",
    label: "ベーシックプラン",
    description: "個別カウンセリング使い放題",
    priceYen: 500,
    paypalPlanId: PAYPAL_BASIC_PLAN_ID || undefined,
  },
  premium: {
    id: "premium",
    label: "プレミアムプラン",
    description: "個別+チームカウンセリング",
    priceYen: 1500,
    paypalPlanId: PAYPAL_PREMIUM_PLAN_ID || undefined,
  },
};

export function assertPlanSlug(plan: string): plan is PlanSlug {
  return plan === "basic" || plan === "premium";
}

export function monthsFromNow(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
