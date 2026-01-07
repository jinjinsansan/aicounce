import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";

const ADMIN_EMAILS = new Set(["goldbenchan@gmail.com"]);

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = session.user.email?.toLowerCase();
  if (!userEmail || !ADMIN_EMAILS.has(userEmail)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const adminSupabase = getServiceSupabase();
    const { data: broadcasts, error } = await adminSupabase
      .from("newsletter_broadcasts")
      .select("id, subject, recipient_count, success_count, failed_count, sent_at, sent_by")
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ broadcasts: broadcasts ?? [] });
  } catch (error) {
    console.error("newsletter history error", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
