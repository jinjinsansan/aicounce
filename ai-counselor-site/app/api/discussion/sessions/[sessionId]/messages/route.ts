import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { assertAccess, parseAccessError } from "@/lib/access-control";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

type SaveMessagePayload = {
  role: "debaterA" | "debaterB" | "moderator";
  authorId: string;
  authorName: string;
  authorIconUrl?: string | null;
  content: string;
  createdAt: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await assertAccess(session.user.id, "team", session.user.email ?? null);
  } catch (accessError) {
    const { status, message } = parseAccessError(accessError);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Verify session ownership
    const { data: sessionData, error: sessionError } = await (supabase as any)
      .from("discussion_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", session.user.id)
      .single();

    if (sessionError || !sessionData) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = (await request.json()) as SaveMessagePayload;

    const { data, error } = await (supabase as any)
      .from("discussion_messages")
      .insert({
        session_id: sessionId,
        role: payload.role,
        author_id: payload.authorId,
        author_name: payload.authorName,
        author_icon_url: payload.authorIconUrl ?? null,
        content: payload.content,
        created_at: payload.createdAt,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to save discussion message", error);
      return new Response(JSON.stringify({ error: "Failed to save message" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update session updated_at
    await (supabase as any)
      .from("discussion_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error saving discussion message", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
