import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import { incrementCounselorSessionCount } from "@/lib/counselor-stats";
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
    await assertAccess(session.user.id, "individual", session.user.email ?? null);
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
      query = query.eq("counselor_id", counselorId).limit(20);
    } else {
      query = query.limit(20);
    }

    const { data, error } = await query;

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
    await assertAccess(session.user.id, "individual", session.user.email ?? null);
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

    if (adminSupabase) {
      await incrementCounselorSessionCount(counselorId, adminSupabase);
    }

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error("Conversation create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
