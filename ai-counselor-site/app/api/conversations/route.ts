import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import { assertAccess, parseAccessError } from "@/lib/access-control";

export async function GET(request: NextRequest) {
  const counselorId = request.nextUrl.searchParams.get("counselorId");

  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertAccess(session.user.id, "individual");
  } catch (error) {
    const { status, message } = parseAccessError(error);
    return NextResponse.json({ error: message }, { status });
  }

  try {
    let query = supabase
      .from("conversations")
      .select("id, counselor_id, title, updated_at")
      .eq("user_id", session.user.id)
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
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = hasServiceRole() ? getServiceSupabase() : null;

  try {
    await assertAccess(session.user.id, "individual");
  } catch (error) {
    const { status, message } = parseAccessError(error);
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const { counselorId, title } = await request.json();

    if (!counselorId) {
      return NextResponse.json(
        { error: "counselorId is required" },
        { status: 400 },
      );
    }

    if (adminSupabase) {
      const userEmail = session.user.email ?? `${session.user.id}@example.com`;
      try {
        await adminSupabase
          .from("users")
          .upsert(
            {
              id: session.user.id,
              email: userEmail,
              username:
                session.user.user_metadata?.full_name ??
                session.user.email ??
                "User",
            },
            { onConflict: "id" },
          );
      } catch (error) {
        console.error("Failed to upsert user profile before conversation", error);
      }
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: session.user.id,
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
