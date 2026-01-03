import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!hasServiceRole()) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, conversation_id, created_at, tokens_used")
      .eq("conversation_id", params.id)
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
