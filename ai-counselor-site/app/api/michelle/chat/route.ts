import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { MICHELLE_AI_ENABLED } from "@/lib/feature-flags";
import { michelleEnv } from "@/lib/michelle/env.server";
import { getMichelleAssistantId, getMichelleOpenAIClient } from "@/lib/michelle/openai";
import { retrieveKnowledgeMatches } from "@/lib/michelle/rag";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import { assertAccess, parseAccessError } from "@/lib/access-control";

const requestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  category: z.enum(["love", "life", "relationship"]).optional(),
});

type OpenAIThreads = NonNullable<NonNullable<ReturnType<typeof getMichelleOpenAIClient>["beta"]>["threads"]>;

export async function POST(request: Request) {
  if (!MICHELLE_AI_ENABLED) {
    return NextResponse.json({ error: "Michelle AI is currently disabled" }, { status: 503 });
  }

  if (!michelleEnv.openAiApiKey || !michelleEnv.assistantId) {
    return NextResponse.json({ error: "OpenAI環境変数が不足しています" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertAccess(session.user.id, "individual", session.user.email ?? null);
  } catch (error) {
    const { status, message } = parseAccessError(error);
    return NextResponse.json({ error: message }, { status });
  }

  // Sync basic user profile into public.users when service role is available
  if (hasServiceRole()) {
    try {
      await getServiceSupabase()
        .from("users")
        .upsert(
          {
            id: session.user.id,
            email: session.user.email ?? `${session.user.id}@example.com`,
            username: session.user.user_metadata?.full_name ?? session.user.email ?? "User",
          },
          { onConflict: "id" },
        );
    } catch (error) {
      console.error("[Michelle Chat] Failed to upsert user profile", error);
    }
  }

  try {
    const { sessionId, threadId } = await resolveSession(
      supabase,
      session.user.id,
      parsed.data.sessionId,
      parsed.data.message,
      parsed.data.category,
    );

    // RAG検索
    console.log(`[Michelle Chat] User message: "${parsed.data.message.slice(0, 50)}..."`);
    const knowledgeMatches = await retrieveKnowledgeMatches(parsed.data.message, {
      matchCount: 8,
      similarityThreshold: 0.45,
    });

    console.log(`[Michelle Chat] RAG matches: ${knowledgeMatches.length}`);
    if (knowledgeMatches.length > 0) {
      console.log(
        `[Michelle Chat] Top 3 similarities:`,
        knowledgeMatches
          .slice(0, 3)
          .map((m) => m.similarity.toFixed(3))
          .join(", "),
      );
    }

    const knowledgeContext = knowledgeMatches
      .map((match, index) => `[参考知識${index + 1}]\n${match.content}`)
      .join("\n\n");

    const finalMessage = knowledgeContext
      ? `【ユーザーメッセージ】\n${parsed.data.message}\n\n---\n内部参考情報（ユーザーには見せないこと）：\n以下のミシェル心理学知識を参考にして回答を構築してください。\n${knowledgeContext}`
      : parsed.data.message;

    // ユーザーメッセージ保存
    await supabase.from("michelle_messages").insert({
      session_id: sessionId,
      role: "user",
      content: parsed.data.message,
    });

    // OpenAI Assistants API へ送信
    const openai = getMichelleOpenAIClient();
    const betaThreads = openai.beta?.threads as OpenAIThreads | undefined;
    if (!betaThreads) {
      throw new Error("OpenAI Assistants API is unavailable in the current SDK version");
    }

    try {
      await betaThreads.messages.create(threadId, { role: "user", content: finalMessage });
    } catch (openaiError) {
      console.error("[Michelle Chat] OpenAI message creation error:", openaiError);
      if (openaiError instanceof Error && openaiError.message.includes("while a run")) {
        return NextResponse.json(
          { error: "前の応答がまだ処理中です。少しお待ちください。" },
          { status: 429 },
        );
      }
      throw openaiError;
    }

    console.log("[Michelle Chat] Starting assistant completion...");
    const assistantResponse = await runBufferedCompletion(betaThreads, threadId);
    console.log(`[Michelle Chat] Assistant response length: ${assistantResponse.length} chars`);

    // 応答保存
    if (assistantResponse.trim()) {
      await supabase.from("michelle_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantResponse,
      });

      await supabase
        .from("michelle_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    console.log("[Michelle Chat] Chat completion successful");
    return NextResponse.json({
      sessionId,
      message: assistantResponse,
      knowledge: knowledgeMatches.slice(0, 4),
    });
  } catch (error) {
    console.error("Michelle chat error", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const resolveSession = async (
  supabase: ReturnType<typeof createSupabaseRouteClient>,
  userId: string,
  sessionId: string | undefined,
  message: string,
  category: z.infer<typeof requestSchema>["category"],
) => {
  if (sessionId) {
    const { data, error } = await supabase
      .from("michelle_sessions")
      .select("id, openai_thread_id")
      .eq("id", sessionId)
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Session not found");
    }

    const threadId = await ensureThreadId(supabase, data.id, data.openai_thread_id);
    return { sessionId: data.id, threadId };
  }

  const { data, error } = await supabase
    .from("michelle_sessions")
    .insert({
      auth_user_id: userId,
      category: category ?? "life",
      title: message.trim().slice(0, 60) || "新しい相談",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create session");
  }

  const threadId = await ensureThreadId(supabase, data.id, null);
  return { sessionId: data.id, threadId };
};

const ensureThreadId = async (
  supabase: ReturnType<typeof createSupabaseRouteClient>,
  sessionId: string,
  threadId: string | null,
) => {
  if (threadId) return threadId;

  const openai = getMichelleOpenAIClient();
  const betaThreads = openai.beta?.threads;
  if (!betaThreads) {
    throw new Error("OpenAI Assistants API is unavailable in the current SDK version");
  }

  const thread = await betaThreads.create();
  await supabase.from("michelle_sessions").update({ openai_thread_id: thread.id }).eq("id", sessionId);
  return thread.id;
};

const runBufferedCompletion = async (threads: OpenAIThreads, threadId: string) => {
  const assistantId = getMichelleAssistantId();
  let fullReply = "";

  await new Promise<void>((resolve, reject) => {
    const stream = threads.runs.stream(threadId, { assistant_id: assistantId });

    stream
      .on("textDelta", (delta: { value?: string }) => {
        if (delta.value) {
          fullReply += delta.value;
        }
      })
      .on("error", (error: unknown) => {
        console.error("[Michelle Chat] Stream error:", error);
        reject(error);
      })
      .on("end", () => {
        resolve();
      });
  });

  return fullReply;
};
