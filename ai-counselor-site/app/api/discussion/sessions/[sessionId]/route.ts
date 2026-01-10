import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { assertAccess, parseAccessError } from "@/lib/access-control";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
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
    // Fetch session details
    const { data: sessionData, error: sessionError } = await (supabase as any)
      .from("discussion_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", session.user.id)
      .single();

    if (sessionError || !sessionData) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await (supabase as any)
      .from("discussion_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Failed to fetch discussion messages", messagesError);
      return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        session: sessionData,
        messages: messages ?? [],
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error fetching discussion session", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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
    const { error } = await (supabase as any)
      .from("discussion_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Failed to delete discussion session", error);
      return new Response(JSON.stringify({ error: "Failed to delete session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error deleting discussion session", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
