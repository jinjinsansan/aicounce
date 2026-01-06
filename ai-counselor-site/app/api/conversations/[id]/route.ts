import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createSupabaseRouteClient } from "@/lib/supabase-clients";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (error || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { error: messagesError, count: messagesCount } = await supabase
      .from("messages")
      .delete({ count: "exact" })
      .eq("conversation_id", id);
    
    if (messagesError) {
      console.error("Failed to delete messages:", messagesError);
      return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 });
    }

    console.log(`Deleted ${messagesCount ?? 0} messages for conversation ${id}`);

    const { error: conversationError, count: conversationCount } = await supabase
      .from("conversations")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", session.user.id);
    
    if (conversationError) {
      console.error("Failed to delete conversation:", conversationError);
      return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }

    if (conversationCount === 0) {
      console.error("Conversation was not deleted (count=0):", id);
      return NextResponse.json({ error: "Conversation could not be deleted" }, { status: 500 });
    }

    console.log(`Successfully deleted conversation ${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("conversation delete error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
