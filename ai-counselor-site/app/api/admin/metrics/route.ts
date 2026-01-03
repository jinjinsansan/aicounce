import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminMetrics } from "@/lib/admin-metrics";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseRouteClient(cookieStore);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const metrics = await getAdminMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Admin metrics handler failed", error);
    return NextResponse.json({ error: "Failed to load metrics" }, { status: 500 });
  }
}
