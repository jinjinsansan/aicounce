import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const counselorId = request.nextUrl.searchParams.get("counselorId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (!hasServiceRole()) {
    return NextResponse.json({ conversations: [] });
  }

  try {
    const supabase = getServiceSupabase();
    let query = supabase
      .from("conversations")
      .select("id, counselor_id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (counselorId) {
      query = query.eq("counselor_id", counselorId).limit(1);
      const { data, error } = await query.single();
      if (error) {
        console.error("Failed to fetch conversation", error);
        return NextResponse.json({ conversation: null });
      }
      return NextResponse.json({ conversation: data });
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error("Failed to fetch conversations", error);
      return NextResponse.json({ conversations: [] });
    }

    return NextResponse.json({ conversations: data ?? [] });
  } catch (error) {
    console.error("Conversation API error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 500 },
    );
  }

  try {
    const { userId, counselorId, title } = await request.json();

    if (!userId || !counselorId) {
      return NextResponse.json(
        { error: "userId and counselorId are required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: userId,
          counselor_id: counselorId,
          title: title ?? null,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create conversation", error);
      return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error("Conversation create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
