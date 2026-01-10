import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { assertAccess, parseAccessError } from "@/lib/access-control";

export async function GET() {
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
    const { data, error } = await (supabase as any)
      .from("discussion_sessions")
      .select("id, title, topic, updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch discussion sessions", error);
      return new Response(JSON.stringify({ error: "Failed to fetch sessions" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data ?? []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error fetching discussion sessions", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

type CreateSessionPayload = {
  topic: string;
  debaterAId: string;
  debaterBId: string;
  moderatorId?: string | null;
  debaterAStyle: string;
  debaterBStyle: string;
  moderatorStyle?: string;
  rounds: number;
};

export async function POST(request: Request) {
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
    const payload = (await request.json()) as CreateSessionPayload;
    const title = payload.topic.slice(0, 50) + (payload.topic.length > 50 ? "..." : "");

    const { data, error } = await (supabase as any)
      .from("discussion_sessions")
      .insert({
        user_id: session.user.id,
        title,
        topic: payload.topic,
        debater_a_id: payload.debaterAId,
        debater_b_id: payload.debaterBId,
        moderator_id: payload.moderatorId ?? null,
        debater_a_style: payload.debaterAStyle,
        debater_b_style: payload.debaterBStyle,
        moderator_style: payload.moderatorStyle ?? null,
        rounds: payload.rounds,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create discussion session", error);
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error creating discussion session", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
