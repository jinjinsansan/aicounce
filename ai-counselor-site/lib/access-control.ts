import { getServiceSupabase } from "@/lib/supabase-server";

export type PlanTier = "none" | "basic" | "premium";

export type AccessState = {
  plan: PlanTier;
  hasActiveSubscription: boolean;
  onTrial: boolean;
  trialExpiresAt?: string;
  lineLinked: boolean;
  canUseIndividual: boolean;
  canUseTeam: boolean;
};

const BASIC_PLANS: PlanTier[] = ["basic", "premium"];

export async function resolveAccessState(userId: string): Promise<AccessState> {
  const supabase = getServiceSupabase();

  const [{ data: subscription }, { data: trial }, { data: user }] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select("*, plan:billing_plans(tier)")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_trials")
      .select("line_linked, trial_expires_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("line_linked_at")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const planTier = (subscription?.plan?.tier as PlanTier | null) ?? "none";
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const hasActiveSubscription = Boolean(
    subscription && subscription.status === "active" && (!periodEnd || periodEnd.getTime() > Date.now()),
  );

  const trialExpiresAt = trial?.trial_expires_at ?? undefined;
  const onTrial = Boolean(
    trialExpiresAt && new Date(trialExpiresAt).getTime() > Date.now(),
  );
  const lineLinked = Boolean(trial?.line_linked ?? user?.line_linked_at);

  const canUseIndividual = hasActiveSubscription
    ? BASIC_PLANS.includes(planTier)
    : onTrial;
  const canUseTeam = hasActiveSubscription
    ? planTier === "premium"
    : onTrial;

  return {
    plan: hasActiveSubscription ? planTier : "none",
    hasActiveSubscription,
    onTrial,
    trialExpiresAt,
    lineLinked,
    canUseIndividual,
    canUseTeam,
  };
}

export async function assertAccess(
  userId: string,
  requirement: "individual" | "team",
) {
  const state = await resolveAccessState(userId);
  const allowed =
    requirement === "individual" ? state.canUseIndividual : state.canUseTeam;
  if (!allowed) {
    const planNeeded = requirement === "individual" ? "basic" : "premium";
    throw Object.assign(new Error("payment_required"), {
      status: 402,
      detail: `Please subscribe to the ${planNeeded} plan or link LINE for trial`,
    });
  }
}

type AccessErrorShape = {
  status?: number | string;
  detail?: string;
  message?: string;
};

export function parseAccessError(error: unknown): { status: number; message: string } {
  if (typeof error === "object" && error !== null) {
    const shape = error as AccessErrorShape;
    const rawStatus = shape.status;
    const parsedStatus =
      typeof rawStatus === "number"
        ? rawStatus
        : typeof rawStatus === "string" && !Number.isNaN(Number(rawStatus))
          ? Number(rawStatus)
          : null;
    const status = parsedStatus ?? 403;
    const message =
      typeof shape.detail === "string"
        ? shape.detail
        : typeof shape.message === "string"
          ? shape.message
          : "Access denied";

    return { status, message };
  }

  return { status: 403, message: "Access denied" };
}
