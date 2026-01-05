import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { fetchCounselorById } from "@/lib/counselors";
import { callLLM } from "@/lib/llm";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import { searchRagContext } from "@/lib/rag";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getDefaultCounselorPrompt } from "@/lib/prompts/counselorPrompts";
import { assertAccess, parseAccessError } from "@/lib/access-control";

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      counselorId,
      conversationId,
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
      if (status === 402) {
        return NextResponse.json({ error: message }, { status });
      }
      console.error("access check failed", error);
      return NextResponse.json({ error: "Access denied" }, { status });
    }

    let activeConversationId = conversationId ?? null;

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
                session.user.user_metadata?.full_name ?? session.user.email ?? "User",
            },
            { onConflict: "id" },
          );
      } catch (error) {
        console.error("Failed to upsert user profile", error);
      }
    }

    if (activeConversationId) {
      const { error } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", activeConversationId)
        .single();
      if (error) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    }

    if (!activeConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: session.user.id,
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

    let assistantMessageId: string | null = null;
    if (activeConversationId) {
      await supabase.from("messages").insert([
        {
          conversation_id: activeConversationId,
          role: "user",
          content: message,
        },
      ]);
    }

    let ragContext: string | undefined;
    let ragSources: { id: string; chunk_text: string; similarity: number }[] = [];
    let ragDurationMs: number | null = null;

    if (useRag && counselor.ragEnabled) {
      const ragStart =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      const ragResult = await searchRagContext(counselorId, message);
      ragContext = ragResult.context || undefined;
      ragSources = ragResult.sources;
      const ragEnd =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      ragDurationMs = Math.round(ragEnd - ragStart);
      if (ragSources.length > 0) {
        console.info(
          `[RAG] counselor=${counselorId} chunks=${ragSources.length} duration=${ragDurationMs}ms`,
        );
      }
    }

    const systemPrompt =
      getDefaultCounselorPrompt(counselor.id) ??
      counselor.systemPrompt ??
      "You are a supportive counselor who responds in Japanese with empathy and actionable advice.";

    const { content, tokensUsed } = await callLLM(
      counselor.modelType ?? "openai",
      counselor.modelName ?? "gpt-4o-mini",
      systemPrompt,
      message,
      ragContext,
    );

    if (activeConversationId) {
      const { data: assistantRows, error: assistantError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: activeConversationId,
            role: "assistant",
            content,
            tokens_used: tokensUsed ?? null,
          },
        ])
        .select()
        .single();

      if (!assistantError && assistantRows) {
        assistantMessageId = assistantRows.id;
      }
    }

    if (adminSupabase && assistantMessageId && ragSources.length > 0) {
      await adminSupabase.from("rag_search_logs").insert([
        {
          message_id: assistantMessageId,
          query: message,
          retrieved_chunks: ragSources,
        },
      ]);
    }

    return NextResponse.json({
      conversationId: activeConversationId ?? counselorId,
      counselorId,
      content,
      tokensUsed: tokensUsed ?? 0,
      ragSources,
      ragDurationMs: ragDurationMs ?? 0,
    });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
