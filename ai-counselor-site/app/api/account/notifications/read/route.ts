import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { ids?: unknown; all?: unknown };
  try {
    payload = (await request.json()) as { ids?: unknown; all?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const markAll = payload.all === true;
  const ids = Array.isArray(payload.ids) ? payload.ids.filter((id): id is string => typeof id === "string" && id.length > 0) : [];

  if (!markAll && ids.length === 0) {
    return NextResponse.json({ error: "ids is required" }, { status: 400 });
  }

  const adminSupabase = getServiceSupabase();
  let updateQuery = adminSupabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", session.user.id)
    .is("deleted_at", null)
    .is("read_at", null);

  if (!markAll) {
    updateQuery = updateQuery.in("id", ids);
  }

  const { error: updateError } = await updateQuery;
  if (updateError) {
    console.error("Failed to mark notifications as read", updateError);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }

  const { data, error: fetchError } = await adminSupabase
    .from("notifications")
    .select("id, title, body, sent_at, read_at")
    .eq("user_id", session.user.id)
    .is("deleted_at", null)
    .order("sent_at", { ascending: false })
    .limit(10);

  if (fetchError) {
    console.error("Failed to reload notifications", fetchError);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }

  return NextResponse.json({ notifications: data ?? [] });
}
