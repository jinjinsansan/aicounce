import { getAdminSupabase } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const [supabase, authError] = await getAdminSupabase();
  if (authError) return authError;

  try {
    // Get all users with related data
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        username,
        created_at,
        line_linked_at,
        official_line_id,
        paypal_payer_id
      `)
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;

    // Get conversation counts per user
    const { data: conversationCounts, error: conversationError } = await supabase
      .from("conversations")
      .select("user_id")
      .then((result) => {
        if (result.error) throw result.error;
        const counts = new Map<string, number>();
        for (const conv of result.data) {
          counts.set(conv.user_id, (counts.get(conv.user_id) || 0) + 1);
        }
        return { data: counts, error: null };
      });

    if (conversationError) throw conversationError;

    // Get subscription status per user
    const { data: subscriptions, error: subError } = await supabase
      .from("user_subscriptions")
      .select("user_id, status, plan_id")
      .in("status", ["active", "trialing"]);

    if (subError) throw subError;

    const subMap = new Map(subscriptions.map((s) => [s.user_id, s]));

    // Build result
    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      registeredAt: u.created_at,
      lineLinked: !!u.line_linked_at,
      chatCount: conversationCounts.get(u.id) || 0,
      hasPayment: !!u.paypal_payer_id || subMap.has(u.id),
      subscriptionStatus: subMap.get(u.id)?.status || null,
      subscriptionPlan: subMap.get(u.id)?.plan_id || null,
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Failed to fetch users", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
