import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase-clients";

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify session ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teamSession, error: sessionError } = await (supabase as any)
    .from("team_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("auth_user_id", session.user.id)
    .single();

  if (sessionError || !teamSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("team_messages")
    .select("id, role, content, author, author_id, icon_url, created_at")
    .eq("team_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch team messages", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify session ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teamSession, error: sessionError } = await (supabase as any)
    .from("team_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("auth_user_id", session.user.id)
    .single();

  if (sessionError || !teamSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json();
  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  // Insert messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("team_messages")
    .insert(
      messages.map((msg: {
        role: "user" | "assistant";
        content: string;
        author?: string;
        author_id?: string;
        icon_url?: string;
      }) => ({
        team_session_id: sessionId,
        role: msg.role,
        content: msg.content,
        author: msg.author || null,
        author_id: msg.author_id || null,
        icon_url: msg.icon_url || null,
      }))
    )
    .select();

  if (error) {
    console.error("Failed to save team messages", error);
    return NextResponse.json({ error: "Failed to save messages" }, { status: 500 });
  }

  // Update session timestamp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("team_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return NextResponse.json({ messages: data });
}
