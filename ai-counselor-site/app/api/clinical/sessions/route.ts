import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CLINICAL_AI_ENABLED } from "@/lib/feature-flags";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";

export async function GET() {
  if (!CLINICAL_AI_ENABLED) {
    return NextResponse.json({ error: "Clinical AI is currently disabled" }, { status: 503 });
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("clinical_sessions")
    .select("id, title, updated_at")
    .eq("auth_user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch Clinical sessions", error);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}
