import { getAdminSupabase } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const [supabase, authError] = await getAdminSupabase();
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const conversationId = searchParams.get("conversationId");

  try {
    if (conversationId) {
      // Get specific conversation with messages
      // NOTE: This endpoint returns user PII (email addresses) for emergency response.
      // Access is logged via admin_audit_logs. Ensure GDPR/privacy compliance.
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select(`
          id,
          title,
          created_at,
          updated_at,
          user_id,
          counselor_id,
          users (email, username),
          counselors (name)
        `)
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;

      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      return NextResponse.json({
        conversation: {
          ...conversation,
          userEmail: conversation.users?.email,
          counselorName: conversation.counselors?.name,
        },
        messages,
      });
    }

    if (userId) {
      // Get all conversations for a user
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select(`
          id,
          title,
          created_at,
          updated_at,
          counselor_id,
          counselors (name, specialty)
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      return NextResponse.json({ conversations });
    }

    // Get recent conversations across all users
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select(`
        id,
        title,
        created_at,
        updated_at,
        user_id,
        counselor_id,
        users (email, username),
        counselors (name, specialty)
      `)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (convError) throw convError;

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Failed to fetch chat history", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 },
    );
  }
}
