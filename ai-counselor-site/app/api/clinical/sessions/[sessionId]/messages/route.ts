import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { CLINICAL_AI_ENABLED } from "@/lib/feature-flags";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";

const paramsSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  if (!CLINICAL_AI_ENABLED) {
    return NextResponse.json({ error: "Clinical AI is currently disabled" }, { status: 503 });
  }

  const { sessionId } = paramsSchema.parse(await context.params);
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from("clinical_sessions")
    .select("id, title")
    .eq("id", sessionId)
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from("clinical_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("Failed to load clinical messages", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }

  return NextResponse.json({ session: sessionRow, messages: messages ?? [] });
}
