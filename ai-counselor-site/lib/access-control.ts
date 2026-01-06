import { getServiceSupabase } from "@/lib/supabase-server";

export type PlanTier = "none" | "basic" | "premium";

export type AccessState = {
  plan: PlanTier;
  hasActiveSubscription: boolean;
  onTrial: boolean;
  trialExpiresAt?: string;
  lineLinked: boolean;
  campaignAccess?: {
    code: string;
    expiresAt: string;
  } | null;
  canUseIndividual: boolean;
  canUseTeam: boolean;
};

const BASIC_PLANS: PlanTier[] = ["basic", "premium"];
const ADMIN_EMAILS = new Set(["goldbenchan@gmail.com"]);

export async function resolveAccessState(userId: string, sessionEmail?: string | null): Promise<AccessState> {
  const supabase = getServiceSupabase();

  const nowIso = new Date().toISOString();

  const [{ data: subscription }, { data: trial }, { data: user }, { data: campaign }] = await Promise.all([
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
      .select("line_linked_at, email")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("campaign_redemptions")
      .select("expires_at, campaign:campaign_codes(code)")
      .eq("user_id", userId)
      .gt("expires_at", nowIso)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const planTier = (subscription?.plan?.tier as PlanTier | null) ?? "none";
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const hasActiveSubscription = Boolean(
    subscription && subscription.status === "active" && (!periodEnd || periodEnd.getTime() > Date.now()),
  );

  const dbEmail = user?.email ? user.email.toLowerCase() : null;
  const normalizedSessionEmail = sessionEmail ? sessionEmail.toLowerCase() : null;
  const effectiveEmail = dbEmail ?? normalizedSessionEmail;
  const isAdmin = Boolean(effectiveEmail && ADMIN_EMAILS.has(effectiveEmail));

  const trialExpiresAt = trial?.trial_expires_at ?? undefined;
  const onTrial = Boolean(
    trialExpiresAt && new Date(trialExpiresAt).getTime() > Date.now(),
  );
  const lineLinked = Boolean(trial?.line_linked ?? user?.line_linked_at);
  const campaignData = campaign as
    | {
        expires_at: string | null;
        campaign?: { code?: string | null } | null;
      }
    | null;

  const campaignExpiresAt = campaignData?.expires_at ?? undefined;
  const hasCampaignAccess = Boolean(
    campaignExpiresAt && new Date(campaignExpiresAt).getTime() > Date.now(),
  );

  const canUseIndividual = isAdmin
    ? true
    : hasActiveSubscription
        ? BASIC_PLANS.includes(planTier)
        : onTrial || hasCampaignAccess;
  const canUseTeam = isAdmin
    ? true
    : hasActiveSubscription
        ? planTier === "premium"
        : onTrial || hasCampaignAccess;

  return {
    plan: isAdmin || hasActiveSubscription ? planTier : "none",
    hasActiveSubscription: isAdmin ? true : hasActiveSubscription,
    onTrial,
    trialExpiresAt,
    lineLinked,
    campaignAccess:
      hasCampaignAccess && campaignExpiresAt
        ? {
            code: campaignData?.campaign?.code ?? "",
            expiresAt: campaignExpiresAt,
          }
        : null,
    canUseIndividual,
    canUseTeam,
  };
}

export async function assertAccess(
  userId: string,
  requirement: "individual" | "team",
  sessionEmail?: string | null,
) {
  const state = await resolveAccessState(userId, sessionEmail);
  const allowed =
    requirement === "individual" ? state.canUseIndividual : state.canUseTeam;
  if (!allowed) {
    const planNeeded = requirement === "individual" ? "basic" : "premium";
    throw Object.assign(new Error("payment_required"), {
      status: 402,
      detail: `Please subscribe to the ${planNeeded} plan or use an active trial / campaign code`,
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
