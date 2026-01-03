import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchCounselorById } from "@/lib/counselors";
import { callLLM } from "@/lib/llm";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      counselorId,
      conversationId,
      userId,
      useRag,
    } = await request.json();

    if (!message || !counselorId) {
      return NextResponse.json(
        { error: "message and counselorId are required" },
        { status: 400 },
      );
    }

    const counselor = await fetchCounselorById(counselorId);
    if (!counselor) {
      return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
    }

    const finalUserId =
      userId || process.env.DEMO_USER_ID || "00000000-0000-0000-0000-000000000000";

    const supabaseReady = hasServiceRole();
    const supabase = supabaseReady ? getServiceSupabase() : null;

    let activeConversationId = conversationId ?? null;

    if (supabase) {
      try {
        await supabase
          .from("users")
          .upsert(
            {
              id: finalUserId,
              email: "demo@example.com",
              username: "Demo User",
            },
            { onConflict: "id" },
          );
      } catch (error) {
        console.error("Failed to upsert demo user", error);
      }
    }

    if (supabase && !activeConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: finalUserId,
            counselor_id: counselorId,
            title: `${counselor.name}との相談`,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        activeConversationId = data.id;
      }
    }

    if (supabase && activeConversationId) {
      await supabase.from("messages").insert([
        {
          conversation_id: activeConversationId,
          role: "user",
          content: message,
        },
      ]);
    }

    const ragContext = useRag ? "" : undefined; // Phase4 placeholder
    const { content, tokensUsed } = await callLLM(
      counselor.modelType ?? "openai",
      counselor.modelName ?? "gpt-4o-mini",
      counselor.systemPrompt,
      message,
      ragContext,
    );

    if (supabase && activeConversationId) {
      await supabase.from("messages").insert([
        {
          conversation_id: activeConversationId,
          role: "assistant",
          content,
          tokens_used: tokensUsed ?? null,
        },
      ]);
    }

    return NextResponse.json({
      conversationId: activeConversationId ?? conversationId ?? counselorId,
      counselorId,
      content,
      tokensUsed: tokensUsed ?? 0,
    });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
