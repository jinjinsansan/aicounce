import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { assertAccess, parseAccessError } from "@/lib/access-control";

async function withSession(sessionId: string) {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    await assertAccess(session.user.id, "team");
  } catch (error) {
    const { status, message } = parseAccessError(error);
    return {
      error: NextResponse.json(
        { error: message },
        { status },
      ),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teamSession, error: sessionError } = await (supabase as any)
    .from("team_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("auth_user_id", session.user.id)
    .single();

  if (sessionError || !teamSession) {
    return { error: NextResponse.json({ error: "Session not found" }, { status: 404 }) };
  }

  return { supabase, session };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const context = await withSession(sessionId);
  if ("error" in context) return context.error;
  const { supabase } = context;

  const body = await req.json();
  const { participants } = body ?? {};

  if (!Array.isArray(participants)) {
    return NextResponse.json({ error: "Invalid participants" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("team_sessions")
    .update({ participants, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update session participants", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const context = await withSession(sessionId);
  if ("error" in context) return context.error;
  const { supabase, session } = context;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("team_messages").delete().eq("team_session_id", sessionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("team_sessions").delete().eq("id", sessionId).eq("auth_user_id", session.user.id);

  return NextResponse.json({ success: true });
}
