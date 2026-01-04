import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { CLINICAL_AI_ENABLED } from "@/lib/feature-flags";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";

const paramsSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function DELETE(_: Request, context: { params: Promise<{ sessionId: string }> }) {
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

  const { error } = await supabase
    .from("clinical_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("auth_user_id", session.user.id);

  if (error) {
    console.error("Failed to delete clinical session", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
