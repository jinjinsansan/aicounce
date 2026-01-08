import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { fetchCounselorById } from "@/lib/counselors";
import { callLLMWithHistory, type ChatMessage } from "@/lib/llm";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import { searchRagContext } from "@/lib/rag";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getDefaultCounselorPrompt } from "@/lib/prompts/counselorPrompts";
import { assertAccess, parseAccessError } from "@/lib/access-control";
import { incrementCounselorSessionCount } from "@/lib/counselor-stats";

function normalizeForMatch(value?: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[、。！？!?:：\-–—…「」『』（）()【】\[\]<>]/g, "");
}

function isGreetingOnly(message: string): boolean {
  const greetings = [
    "こんにちは",
    "こんばんは",
    "おはよう",
    "はじめまして",
    "よろしく",
    "hello",
    "hi",
    "hey",
  ];
  const normalized = message.toLowerCase().trim().replace(/[、。！？!?\s]/g, "");
  return greetings.some((g) => normalized === g || normalized === g + "ございます");
}

const CLARIFICATION_PHRASES = [
  "どんなことがあった",
  "具体的に教えて",
  "教えてくれる",
  "話してみて",
  "詳しく教えて",
  "もう少し教えて",
] as const;

function containsClarificationPrompt(text: string) {
  const norm = normalizeForMatch(text);
  return CLARIFICATION_PHRASES.some((p) => norm.includes(normalizeForMatch(p)));
}

function isAdviceRequest(message: string) {
  const norm = normalizeForMatch(message);
  return ["どうしたら", "どうすれば", "助けて", "アドバイス", "解決", "対処"].some((p) =>
    norm.includes(normalizeForMatch(p)),
  );
}

function buildStageGuard(params: {
  counselorId: string;
  historyMessages: ChatMessage[];
  userMessage: string;
}) {
  const { counselorId, historyMessages, userMessage } = params;
  const managed = counselorId === "mitsu" || counselorId === "kenji";
  if (!managed) return { stage: 0 as const, guard: "" };

  const priorNonGreetingUserCount = historyMessages.filter(
    (m) => m.role === "user" && !isGreetingOnly(m.content),
  ).length;
  const currentNonGreetingUserCount = priorNonGreetingUserCount + 1;

  let stage = Math.min(4, Math.max(1, currentNonGreetingUserCount));
  if (isAdviceRequest(userMessage)) stage = 4;

  if (stage === 1) {
    return {
      stage,
      guard: [
        "【進行（強制）】いまはステップ1（インタビュー）。",
        "- 返答は短く：共感1行 + 質問1つだけ",
        "- ここでは助言/解決策/RAG引用は禁止",
        "- 同じ聞き直しは禁止",
      ].join("\n"),
    };
  }

  if (stage === 2) {
    return {
      stage,
      guard: [
        "【進行（強制）】いまはステップ2（展開＆掘り下げ）。",
        "- 既に聞いた事実を1行で要約してから進める",
        "- 『どんなことがあった』等の事実の聞き直しは禁止",
        "- 感情/影響/背景をたずねる質問は1つだけ",
      ].join("\n"),
    };
  }

  if (stage === 3) {
    return {
      stage,
      guard: [
        "【進行（強制）】いまはステップ3（RAGで解放・気づき）。",
        "- RAG要素を1つ必ず入れて、視点転換を1つ提示",
        "- RAGから短い一節を『』で1つだけ引用する（出典名は言わない）",
        "- 事実の聞き直しは禁止（『どんなことがあった』禁止）",
        "- 質問は1つだけ",
      ].join("\n"),
    };
  }

  return {
    stage,
    guard: [
      "【進行（強制）】いまはステップ4（ゴール）。",
      "- 解決策/希望/光を示す（断定せず提案）",
      "- 3分でできる一歩を1つだけ",
      "- 仕事の相談なら、報告/謝罪/再発防止など『現実の次の一手』を必ず含める（深呼吸だけで終わらない）",
      "- RAGから短い一節を『』で1つだけ引用する（出典名は言わない）",
      "- 事実の聞き直しは禁止（『どんなことがあった』禁止）",
      "- 質問は『これ、できそう？』の1つだけ",
    ].join("\n"),
  };
}

function buildForcedManagedReply(params: {
  counselorId: "mitsu" | "kenji";
  historyMessages: ChatMessage[];
  ragContext?: string;
}) {
  const { counselorId, historyMessages, ragContext } = params;
  const recentUserFacts = historyMessages
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-3)
    .map((m) => m.content.trim())
    .join(" / ")
    .slice(0, 140);

  const raw = String(ragContext ?? "");
  const cleanedRag = raw
    .replace(/\[ソース\s*\d+\][^\n]*\n/g, "")
    .replace(/\(score:[^)]+\)/g, "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)[0]
    ?.slice(0, 90);

  const ragLine = cleanedRag
    ? counselorId === "kenji"
      ? `『${cleanedRag}』──ジョバンニみたいに、いまは一歩を選び直すときなんだ。`
      : `ことばにするとね、こんなのがあるよ。『${cleanedRag}』`
    : counselorId === "kenji"
      ? "ジョバンニも迷いながら『ほんとうのさいわい』を探して、まず一歩を選び直したんだ。"
      : "『つまづいたっていいじゃないか、にんげんだもの』って言葉があるんだよ。";

  const summary = recentUserFacts
    ? `いまは「${recentUserFacts}」のことで胸が苦しいんだね。`
    : "いま胸が苦しいんだね。";

  const action =
    counselorId === "kenji"
      ? "3分だけ、上司に伝える一文をメモしてみよう：『注文忘れ→いまやった対応→再発防止（チェック）』。"
      : "3分だけ、次の一手をメモしてみない？『何が起きた→いま出来る対応→次の防止策1つ』。";

  return `${summary}${ragLine}\n${action}\nこれ、できそう？`;
}

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
      await assertAccess(session.user.id, "individual", session.user.email ?? null);
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
        console.warn("Conversation not found, creating new one:", activeConversationId);
        activeConversationId = null;
      }
    }

    if (!activeConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: session.user.id,
            counselor_id: counselorId,
            title: message.trim().slice(0, 60) || `${counselor.name}との相談`,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        activeConversationId = data.id;
        if (adminSupabase) {
          await incrementCounselorSessionCount(counselorId, adminSupabase);
        }
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

    let historyMessages: ChatMessage[] = [{ role: "user", content: message }];
    if (activeConversationId) {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && Array.isArray(data) && data.length > 0) {
        historyMessages = data
          .slice()
          .reverse()
          .map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: m.content,
          }));
      }
    }

    let ragContext: string | undefined;
    let ragSources: { id: string; chunk_text: string; similarity: number }[] = [];
    let ragDurationMs: number | null = null;

    const ragQueryBase = historyMessages
      .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
      .slice(-3)
      .map((m) => m.content)
      .join("\n")
      .trim() || message;

    const ragQuery =
      counselor.id === "kenji"
        ? `${ragQueryBase}\n\n銀河鉄道の夜 ジョバンニ カムパネルラ ほんとうのさいわい`
        : counselor.id === "mitsu"
          ? `${ragQueryBase}\n\n相田みつを にんげんだもの 書`
          : ragQueryBase;

    if (useRag && counselor.ragEnabled) {
      const ragStart =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      const ragResult = await searchRagContext(counselorId, ragQuery);
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

    const baseSystemPrompt =
      getDefaultCounselorPrompt(counselor.id) ??
      counselor.systemPrompt ??
      "You are a supportive counselor who responds in Japanese with empathy and actionable advice.";

    const finalSystemPrompt = ragContext
      ? `${baseSystemPrompt}

[RAG活用ルール]
- 直近で提供された参考情報を必ず読み、要約や言い換えを交えて回答してください
- 参考情報に含まれる支援策や表現を優先的に取り入れ、ユーザーの状況に合わせて説明してください
- 参考情報と質問がずれている場合は、その旨を一言添えたうえで一般的な助言も補ってください
- 参考情報をそのまま読み上げず、会話調で温かく伝えてください`
      : baseSystemPrompt;

    const { stage, guard: stageGuard } = buildStageGuard({
      counselorId: String(counselor.id),
      historyMessages,
      userMessage: message,
    });

    const guardedSystemPrompt = stageGuard
      ? [stageGuard, finalSystemPrompt].join("\n\n")
      : finalSystemPrompt;

    const { content, tokensUsed } = await callLLMWithHistory(
      counselor.modelType ?? "openai",
      counselor.modelName ?? "gpt-4o-mini",
      guardedSystemPrompt,
      historyMessages,
      ragContext,
    );

    let finalContent = content;
    const managed = counselor.id === "mitsu" || counselor.id === "kenji";
    const mustNotClarify = managed && (stage >= 2 || isAdviceRequest(message));
    const tooGenericForWork =
      managed &&
      stage >= 4 &&
      /(深呼吸|夜空|星|旅)/.test(finalContent) &&
      !/(報告|謝罪|確認|連絡|再発防止|チェック|メモ|上司|お客様|注文)/.test(finalContent);

    const kenjiOtherWork = counselor.id === "kenji" && /雨ニモマケズ/.test(finalContent);
    const kenjiMissingAnchor =
      counselor.id === "kenji" &&
      stage >= 2 &&
      !/(ジョバンニ|カムパネルラ|ほんとうのさいわい|銀河鉄道)/.test(finalContent);

    if ((mustNotClarify && containsClarificationPrompt(finalContent)) || tooGenericForWork || kenjiOtherWork || kenjiMissingAnchor) {
      finalContent = buildForcedManagedReply({
        counselorId: counselor.id as "mitsu" | "kenji",
        historyMessages,
        ragContext,
      });
    }

    if (activeConversationId) {
      const { data: assistantRows, error: assistantError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: activeConversationId,
            role: "assistant",
            content: finalContent,
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
      content: finalContent,
      tokensUsed: tokensUsed ?? 0,
      ragSources,
      ragDurationMs: ragDurationMs ?? 0,
    });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
