import { fetchCounselorById } from "@/lib/counselors";
import { getDefaultCounselorPrompt } from "@/lib/prompts/counselorPrompts";
import { callLLMWithHistory } from "@/lib/llm";
import { searchRagContext } from "@/lib/rag";
import { DISCUSSION_ROUND_OPTIONS, getStyleInstruction } from "@/lib/discussion/config";
import type { DiscussionMessage } from "@/types/discussion";

type Action = "start" | "continue" | "summary";

type ParticipantInput = {
  id: string;
  style?: string;
};

type DiscussionRequest = {
  action?: Action;
  topic?: string;
  rounds?: number;
  debaterA?: ParticipantInput;
  debaterB?: ParticipantInput;
  moderator?: ParticipantInput | null;
  history?: DiscussionMessage[];
};

type ParticipantProfile = {
  id: string;
  name: string;
  iconUrl?: string;
  provider: string;
  modelName: string;
  systemPrompt: string;
  specialty?: string;
  description?: string;
  ragEnabled: boolean;
};

export async function POST(request: Request) {
  let payload: DiscussionRequest;
  try {
    payload = (await request.json()) as DiscussionRequest;
  } catch (error) {
    console.error("Invalid discussion payload", error);
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const action = payload.action ?? "start";
  if (!payload.debaterA?.id || !payload.debaterB?.id) {
    return new Response(JSON.stringify({ error: "AIを2体選択してください" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (payload.debaterA.id === payload.debaterB.id) {
    return new Response(JSON.stringify({ error: "別々のAIを選択してください" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const topic = (payload.topic ?? "").trim();
  if (action !== "summary" && !topic) {
    return new Response(JSON.stringify({ error: "議題を入力してください" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rounds = payload.rounds ?? 3;
  if (
    action !== "summary" &&
    !DISCUSSION_ROUND_OPTIONS.includes(rounds as (typeof DISCUSSION_ROUND_OPTIONS)[number])
  ) {
    return new Response(JSON.stringify({ error: "無効なラウンド数です" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const debaterA = await buildParticipantProfile(payload.debaterA!, "debater");
        const debaterB = await buildParticipantProfile(payload.debaterB!, "debater");
        const moderator = payload.moderator?.id
          ? await buildParticipantProfile(payload.moderator, "moderator")
          : null;

        const history = sanitizeHistory(
          payload.history ?? [],
          [debaterA, debaterB, moderator].filter(Boolean) as ParticipantProfile[],
        );

        if (action === "summary") {
          if (!moderator) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "まとめ役を選択してください" })}\n\n`),
            );
            controller.close();
            return;
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "typing", speakerName: moderator.name })}\n\n`,
            ),
          );
          const summary = await generateModeratorSummary({ topic, history, moderator });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "message", message: summary })}\n\n`),
          );
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
          return;
        }

        await runDebateRoundsStreaming({
          topic,
          rounds,
          debaterA,
          debaterB,
          history,
          controller,
          encoder,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (error) {
        console.error("discussion route error", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: "議論の生成に失敗しました" })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function buildParticipantProfile(
  input: ParticipantInput,
  role: "debater" | "moderator",
): Promise<ParticipantProfile> {
  const counselor = await fetchCounselorById(input.id);
  if (!counselor) {
    throw new Error(`Counselor ${input.id} not found`);
  }

  const provider = counselor.modelType ?? "openai";
  const modelName = counselor.modelName ?? "gpt-4o-mini";
  const basePrompt =
    counselor.systemPrompt ??
    getDefaultCounselorPrompt(counselor.id) ??
    `${counselor.name}は思慮深く共感的なAIカウンセラーです。`;
  const styleInstruction = getStyleInstruction(input.style, role);

  return {
    id: counselor.id,
    name: counselor.name,
    iconUrl: counselor.iconUrl,
    provider,
    modelName,
    systemPrompt: `${basePrompt}\n\n${styleInstruction}`.trim(),
    specialty: counselor.specialty,
    description: counselor.description,
    ragEnabled: Boolean(counselor.ragEnabled),
  };
}

function sanitizeHistory(
  history: DiscussionMessage[],
  participants: ParticipantProfile[],
): DiscussionMessage[] {
  const knownIds = new Set(participants.map((p) => p.id));
  return history
    .filter((item) => item?.content && knownIds.has(item.authorId))
    .map((item) => ({
      ...item,
      content: String(item.content).slice(0, 800),
      createdAt: item.createdAt ?? new Date().toISOString(),
    }))
    .slice(-40);
}

async function runDebateRoundsStreaming(params: {
  topic: string;
  rounds: number;
  debaterA: ParticipantProfile;
  debaterB: ParticipantProfile;
  history: DiscussionMessage[];
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
}): Promise<void> {
  const { topic, rounds, debaterA, debaterB, controller, encoder } = params;
  const history = [...params.history];

  for (let round = 0; round < rounds; round += 1) {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: "typing", speakerName: debaterA.name })}\n\n`),
    );
    const aMessage = await generateDebaterMessage({
      topic,
      speaker: debaterA,
      opponent: debaterB,
      history,
      role: "debaterA",
    });
    history.push(aMessage);
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: "message", message: aMessage })}\n\n`),
    );

    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: "typing", speakerName: debaterB.name })}\n\n`),
    );
    const bMessage = await generateDebaterMessage({
      topic,
      speaker: debaterB,
      opponent: debaterA,
      history,
      role: "debaterB",
    });
    history.push(bMessage);
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: "message", message: bMessage })}\n\n`),
    );
  }
}

async function generateDebaterMessage(params: {
  topic: string;
  speaker: ParticipantProfile;
  opponent: ParticipantProfile;
  history: DiscussionMessage[];
  role: "debaterA" | "debaterB";
}): Promise<DiscussionMessage> {
  const { topic, speaker, opponent, history, role } = params;
  const transcript = buildTranscript(history);

  let ragContext = "";
  if (speaker.ragEnabled) {
    const recentMessages = history
      .slice(-4)
      .map((m) => m.content)
      .join(" ");
    const ragQuery = [topic, recentMessages].filter(Boolean).join("\n");

    try {
      const ragResult = await searchRagContext(speaker.id, ragQuery, 6);
      if (ragResult?.context) {
        ragContext = ragResult.context;
      }
    } catch (error) {
      console.error(`RAG search failed for ${speaker.id}`, error);
    }
  }

  const instructions = [
    `議題: ${topic}`,
    `あなたは ${speaker.name}。相手は ${opponent.name}${opponent.specialty ? `（専門: ${opponent.specialty}）` : ""}。`,
    "50〜120文字程度で端的に、しかし熱量のある語り口で応答してください。",
    "必ず新しい視点や問いを一つ提示し、文章の最後は次に繋がる問いや挑戦で締めます。",
  ];

  if (ragContext) {
    instructions.push(
      "\n【あなたの専門知識】\n以下はあなたが学んだ知識です。この専門知識を活かして議論してください。",
    );
  }

  const userMessage = [
    transcript ? `これまでのやりとり:\n${transcript}\n` : "",
    instructions.join("\n"),
    ragContext ? `\n${ragContext}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { content } = await callLLMWithHistory(
    speaker.provider,
    speaker.modelName,
    speaker.systemPrompt,
    [{ role: "user", content: userMessage }],
  );

  return {
    id: crypto.randomUUID(),
    content,
    authorId: speaker.id,
    authorName: speaker.name,
    authorIconUrl: speaker.iconUrl,
    role,
    createdAt: new Date().toISOString(),
  };
}

async function generateModeratorSummary(params: {
  topic: string;
  history: DiscussionMessage[];
  moderator: ParticipantProfile;
}): Promise<DiscussionMessage> {
  const { topic, history, moderator } = params;
  const transcript = buildTranscript(history);

  let ragContext = "";
  if (moderator.ragEnabled) {
    const recentMessages = history
      .slice(-6)
      .map((m) => m.content)
      .join(" ");
    const ragQuery = [topic, recentMessages].filter(Boolean).join("\n");

    try {
      const ragResult = await searchRagContext(moderator.id, ragQuery, 6);
      if (ragResult?.context) {
        ragContext = ragResult.context;
      }
    } catch (error) {
      console.error(`RAG search failed for moderator ${moderator.id}`, error);
    }
  }

  const instructions = [
    transcript ? `議論ログ:\n${transcript}` : "",
    `議題: ${topic || "(テーマなし)"}`,
    "上記の議論を3〜5行で整理してください。双方の主張と、次の行動や提案を含めてまとめます。",
  ];

  if (ragContext) {
    instructions.push(
      "\n【あなたの専門知識】\n以下の知識を活かして、より専門的な視点でまとめてください。",
    );
  }

  const prompt = [instructions.join("\n\n"), ragContext ? `\n${ragContext}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const { content } = await callLLMWithHistory(
    moderator.provider,
    moderator.modelName,
    moderator.systemPrompt,
    [{ role: "user", content: prompt }],
  );

  return {
    id: crypto.randomUUID(),
    content,
    authorId: moderator.id,
    authorName: `${moderator.name}（まとめ役）`,
    authorIconUrl: moderator.iconUrl,
    role: "moderator",
    createdAt: new Date().toISOString(),
  };
}

function buildTranscript(history: DiscussionMessage[]) {
  return history
    .slice(-14)
    .map((message) => `${message.authorName}: ${message.content}`)
    .join("\n");
}
