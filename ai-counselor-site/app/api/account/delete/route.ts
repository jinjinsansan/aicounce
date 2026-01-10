import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import type { Database } from "@/types/supabase";

type PostgrestExecutable = PromiseLike<{ error: PostgrestError | null }>;

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRole()) {
    return NextResponse.json({ error: "Service role is not configured" }, { status: 500 });
  }

  const adminSupabase = getServiceSupabase();
  const userId = session.user.id;

  try {
    await deleteUserRelatedData(adminSupabase, userId);

    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      throw new Error(`failed to delete auth user: ${authDeleteError.message}`);
    }
  } catch (error) {
    console.error("Failed to delete account", error);
    return NextResponse.json({ error: "アカウントの削除に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function deleteUserRelatedData(client: SupabaseClient<Database>, userId: string) {
  const clientAny = client as unknown as SupabaseClient<any>;

  const conversationIds = await selectIds(client, "conversations", "id", "user_id", userId);
  if (conversationIds.length > 0) {
    await ensureSuccess("messages", client.from("messages").delete().in("conversation_id", conversationIds));
  }
  await ensureSuccess("conversations", client.from("conversations").delete().eq("user_id", userId));

  const clinicalSessionIds = await selectIds(client, "clinical_sessions", "id", "auth_user_id", userId);
  if (clinicalSessionIds.length > 0) {
    await ensureSuccess(
      "clinical_messages",
      client.from("clinical_messages").delete().in("session_id", clinicalSessionIds),
    );
  }
  await ensureSuccess("clinical_sessions", client.from("clinical_sessions").delete().eq("auth_user_id", userId));

  const michelleSessionIds = await selectIds(client, "michelle_sessions", "id", "auth_user_id", userId);
  if (michelleSessionIds.length > 0) {
    await ensureSuccess(
      "michelle_messages",
      client.from("michelle_messages").delete().in("session_id", michelleSessionIds),
    );
  }
  await ensureSuccess("michelle_sessions", client.from("michelle_sessions").delete().eq("auth_user_id", userId));

  const teamSessionIds = await selectIds(clientAny, "team_sessions", "id", "auth_user_id", userId);
  if (teamSessionIds.length > 0) {
    await ensureSuccess("team_messages", clientAny.from("team_messages").delete().in("team_session_id", teamSessionIds));
  }
  await ensureSuccess("team_sessions", clientAny.from("team_sessions").delete().eq("auth_user_id", userId));

  await Promise.all([
    ensureSuccess("notifications", client.from("notifications").delete().eq("user_id", userId)),
    ensureSuccess("user_trials", client.from("user_trials").delete().eq("user_id", userId)),
    ensureSuccess("user_subscriptions", client.from("user_subscriptions").delete().eq("user_id", userId)),
    ensureSuccess("campaign_redemptions", client.from("campaign_redemptions").delete().eq("user_id", userId)),
    ensureSuccess("diary_entries", client.from("diary_entries").delete().eq("author_id", userId)),
  ]);

  const anonymizedEmail = `deleted-${userId}-${Date.now()}@mentalai.invalid`;
  await ensureSuccess(
    "users",
    client
      .from("users")
      .update({
        email: anonymizedEmail,
        username: null,
        line_linked_at: null,
        official_line_id: null,
        paypal_payer_id: null,
        receive_announcements: false,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId),
  );
}

async function selectIds(
  client: SupabaseClient<any>,
  table: string,
  column: string,
  filterColumn: string,
  userId: string,
) {
  const { data, error } = await client.from(table).select(column).eq(filterColumn, userId);
  if (error) {
    throw new Error(`failed to load ${table}: ${error.message}`);
  }
  return (data ?? []).map((row: Record<string, string>) => row[column]).filter(Boolean);
}

async function ensureSuccess(label: string, query: PostgrestExecutable) {
  const { error } = await query;
  if (error) {
    throw new Error(`[${label}] ${error.message}`);
  }
}
