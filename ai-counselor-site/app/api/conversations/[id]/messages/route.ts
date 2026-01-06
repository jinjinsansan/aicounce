import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { assertAccess, parseAccessError } from "@/lib/access-control";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertAccess(session.user.id, "individual", session.user.email ?? null);
  } catch (error) {
    const { status, message } = parseAccessError(error);
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (conversationError || !conversation || conversation.user_id !== session.user.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, conversation_id, created_at, tokens_used")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch messages", error);
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    console.error("Messages API error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
