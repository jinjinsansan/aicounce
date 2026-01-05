import { NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "process";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { searchRagContext } from "@/lib/rag";
import { MICHELLE_SYSTEM_PROMPT } from "@/lib/team/prompts/michelle";
import { SATO_SYSTEM_PROMPT } from "@/lib/team/prompts/sato";

type Participant = {
  id: string;
  name: string;
  iconUrl: string;
  ragEnabled: boolean;
  systemPrompt: string;
  specializationName: string;
  specializationTerms: string[];
  specialty?: string;
  description?: string;
};

type Specialization = {
  name: string;
  terms: string[];
  systemPrompt: string;
  negativeInstruction: string;
};

function sanitizeContent(raw: string, author?: string) {
  const text = raw.trim();
  if (!author) return text;
  const patterns = [
    new RegExp(`^\\[?${author}\\]?[:：]?\\s*`),
    new RegExp(`^${author}[:：]?\\s*`),
  ];
  for (const p of patterns) {
    const cleaned = text.replace(p, "").trim();
    if (cleaned !== text) return cleaned;
  }
  return text;
}

// 各AIの専門分野を明確に定義
const AI_SPECIALIZATIONS: Record<string, Specialization> = {
  michele: {
    name: "テープ式心理学",
    terms: ["ガムテープ", "5大ネガティブ感情", "ピールダウン", "心の思い込み"],
    systemPrompt: MICHELLE_SYSTEM_PROMPT,
    negativeInstruction: "あなたの専門はテープ式心理学のみです。臨床心理学については言及しないでください。",
  },
  sato: {
    name: "臨床心理学",
    terms: ["認知の歪み", "愛着理論", "認知行動療法", "クライエント中心療法"],
    systemPrompt: SATO_SYSTEM_PROMPT,
    negativeInstruction: "あなたの専門は臨床心理学のみです。テープ式心理学については言及しないでください。",
  },
};

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message, participants, history } = await req.json();
    if (!message || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "invalid request" }, { status: 400 });
    }

    const selected: Participant[] = participants
      .slice(0, 5)
      .map((id: string) => {
        const c = FALLBACK_COUNSELORS.find((v) => v.id === id || v.id === id.toLowerCase());
        const spec = AI_SPECIALIZATIONS[id.toLowerCase()] ?? {
          name: "心理カウンセリング",
          terms: [],
          systemPrompt: "あなたは専門的なAIカウンセラーです。",
          negativeInstruction: "",
        };
        return (
          c && {
            id: c.id,
            name: c.name,
            iconUrl: c.iconUrl ?? "",
            ragEnabled: Boolean(c.ragEnabled),
            systemPrompt: spec.systemPrompt,
            specializationName: spec.name,
            specializationTerms: spec.terms,
            specialty: c.specialty,
            description: c.description,
          }
        );
      })
      .filter(Boolean) as Participant[];

    if (selected.length === 0) {
      return NextResponse.json({ error: "no participants" }, { status: 400 });
    }

    const userMessage = String(message).slice(0, 4000);
    const previousMessages: { role: "user" | "assistant"; content: string; author?: string }[] = Array.isArray(history)
      ? history
          .map((m: { role: "user" | "assistant"; content: string; author?: string }) => ({
            role: m.role,
            content: m.content,
            author: m.author,
          }))
          .filter((m) => m.role === "user" || m.role === "assistant")
      : [];

    const responses: { author: string; authorId: string; content: string; iconUrl: string }[] = [];

    // 順次生成：各AIが前のAIの発言を見られるようにする
    for (let i = 0; i < selected.length; i++) {
      const p = selected[i];
      const spec = AI_SPECIALIZATIONS[p.id.toLowerCase()];
      const { context } = p.ragEnabled ? await searchRagContext(p.id, userMessage, 6) : { context: "" };

      // チーム用の専門分野別指示（明確に分離）
      const teamInstructions = [
        "\n---\n",
        "## チームカウンセリング特別指示",
        "",
        "### あなたの専門分野（厳守）",
        spec ? spec.negativeInstruction : "",
        `必ず「${p.specializationName}では〇〇」という表現を使ってください。`,
        p.specializationTerms.length > 0
          ? `あなたの専門用語: ${p.specializationTerms.join("、")}`
          : "",
        "",
        "### 他のカウンセラーとの協力",
        i === 0
          ? "あなたが最初の回答者です。あなたの専門性を明確に示してください。"
          : "他のカウンセラーが既に発言しています。彼らの意見を尊重しつつ、あなたの専門分野から独自の視点を加えてください。",
        i > 0 ? "例：「○○さんのおっしゃる通り〜」「○○さんの意見に加えて〜」など" : "",
        "",
        "### 回答スタイル",
        "- 回答は200〜500文字程度で、本質を伝える",
        "- 本文に自分の名前は書かない（既に表示されています）",
        "- 挨拶の繰り返しは最小限に",
      ].join("\n");

      // RAGコンテキストの追加
      const ragContext = context
        ? `\n\n## 参考情報（RAG検索結果）\n以下の専門知識を活用して回答してください：\n${context}`
        : "";

      // 完全なシステムプロンプト
      const system = p.systemPrompt + teamInstructions + ragContext;

      // 既存の履歴 + このラウンドで既に生成された他AIの発言
      const chatHistory = [
        ...previousMessages.slice(-6).map((m) => ({ role: m.role, content: `${m.author ? `[${m.author}] ` : ""}${m.content}` })),
        ...responses.map((r) => ({ role: "assistant" as const, content: `[${r.author}] ${r.content}` })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          ...chatHistory,
          { role: "user", content: userMessage },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content ?? "";
      const sanitized = sanitizeContent(content, p.name);

      // 生成後すぐに履歴に追加（次のAIがこの発言を見られるようにする）
      responses.push({ author: p.name, authorId: p.id, content: sanitized, iconUrl: p.iconUrl });
    }

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("team respond error", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
