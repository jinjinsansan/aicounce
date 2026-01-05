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

    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id).eq("user_id", session.user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("conversation delete error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
