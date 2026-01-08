import { getServiceSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "goldbenchan@gmail.com";

export async function GET() {
  const supabase = getServiceSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Users active in last 5 minutes (based on last_login_at)
    const { data: activeUsers, error: activeError } = await supabase
      .from("users")
      .select("id, email, last_login_at")
      .gte("last_login_at", fiveMinutesAgo)
      .order("last_login_at", { ascending: false });

    if (activeError) throw activeError;

    // Recent messages in last 5 minutes
    const { data: recentMessages, error: messagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, role, created_at")
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    if (messagesError) throw messagesError;

    // Team messages in last 5 minutes
    const { data: teamMessages, error: teamError } = await supabase
      .from("team_messages")
      .select("id, team_session_id, role, created_at")
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    if (teamError) throw teamError;

    // Total registered users
    const { count: totalUsers, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    return NextResponse.json({
      activeUsers: activeUsers.length,
      recentMessageCount: recentMessages.length,
      recentTeamMessageCount: teamMessages.length,
      totalUsers: totalUsers || 0,
      activeUserList: activeUsers.map((u) => ({
        email: u.email,
        lastLoginAt: u.last_login_at,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch realtime stats", error);
    return NextResponse.json(
      { error: "Failed to fetch realtime stats" },
      { status: 500 },
    );
  }
}
