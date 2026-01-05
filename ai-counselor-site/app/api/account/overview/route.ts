import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";
import { resolveAccessState } from "@/lib/access-control";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminSupabase = getServiceSupabase();
    const profilePayload = {
      id: session.user.id,
      email: session.user.email ?? `${session.user.id}@mentalai.team`,
      username:
        session.user.user_metadata?.full_name ??
        session.user.email ??
        session.user.user_metadata?.name ??
        null,
      last_login_at: new Date().toISOString(),
    };

    await adminSupabase.from("users").upsert(profilePayload, { onConflict: "id" });

    const [
      { data: subscription },
      { data: trial },
      { data: notifications },
      { data: campaignRedemption },
    ] = await Promise.all([
      adminSupabase
        .from("user_subscriptions")
        .select("plan_id, status, current_period_end")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("user_trials")
        .select("line_linked, trial_expires_at, trial_started_at")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      adminSupabase
        .from("notifications")
        .select("id, title, body, sent_at, read_at")
        .eq("user_id", session.user.id)
        .order("sent_at", { ascending: false })
        .limit(10),
      adminSupabase
        .from("campaign_redemptions")
        .select("expires_at, campaign:campaign_codes(code, description)")
        .eq("user_id", session.user.id)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const access = await resolveAccessState(session.user.id);

    return NextResponse.json({
      profile: {
        email: profilePayload.email,
        username: profilePayload.username,
        lastLoginAt: profilePayload.last_login_at,
      },
      subscription: subscription ?? null,
      trial: trial ?? null,
      campaign: campaignRedemption ?? null,
      notifications: notifications ?? [],
      access,
    });
  } catch (error) {
    console.error("account overview error", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
