import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
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
    const state = await resolveAccessState(session.user.id);
    return NextResponse.json({ state });
  } catch (error) {
    console.error("access state error", error);
    return NextResponse.json({ error: "Failed to resolve access" }, { status: 500 });
  }
}
