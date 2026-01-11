import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function POST() {
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
    const { data: existingTrial, error: trialError } = await adminSupabase
      .from("user_trials")
      .select("line_linked")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (trialError) {
      throw trialError;
    }

    if (existingTrial?.line_linked) {
      return NextResponse.json(
        { error: "すでに公式LINEと連携済みです" },
        { status: 409 },
      );
    }

    await adminSupabase
      .from("user_trials")
      .upsert(
        {
          user_id: session.user.id,
          source: "line",
          line_linked: true,
          trial_started_at: new Date().toISOString(),
          trial_expires_at: null,
        },
        { onConflict: "user_id" },
      );

    await adminSupabase
      .from("users")
      .update({ line_linked_at: new Date().toISOString() })
      .eq("id", session.user.id);

    return NextResponse.json({ success: true, trialExpiresAt: null });
  } catch (error) {
    console.error("line trial error", error);
    return NextResponse.json({ error: "Failed to start trial" }, { status: 500 });
  }
}
