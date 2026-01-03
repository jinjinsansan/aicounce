import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { MICHELLE_AI_ENABLED } from "@/lib/feature-flags";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import type { Database } from "@/types/supabase";

const paramsSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(_: Request, context: { params: { sessionId: string } }) {
  if (!MICHELLE_AI_ENABLED) {
    return NextResponse.json({ error: "Michelle AI is currently disabled" }, { status: 503 });
  }

  const { sessionId } = paramsSchema.parse(context.params);
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient<Database>(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from("michelle_sessions")
    .select("id, title, category")
    .eq("id", sessionId)
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from("michelle_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("Failed to load michelle messages", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }

  return NextResponse.json({ session: sessionRow, messages: messages ?? [] });
}
