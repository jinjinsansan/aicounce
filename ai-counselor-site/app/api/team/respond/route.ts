import { NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "process";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { searchRagContext } from "@/lib/rag";
import { MICHELLE_SYSTEM_PROMPT } from "@/lib/team/prompts/michelle";
import { SATO_SYSTEM_PROMPT } from "@/lib/team/prompts/sato";
import { ADAM_SYSTEM_PROMPT } from "@/lib/team/prompts/adam";
import { GEMINI_SYSTEM_PROMPT } from "@/lib/team/prompts/gemini";
import { CLAUDE_SYSTEM_PROMPT } from "@/lib/team/prompts/claude";
import { DEEP_SYSTEM_PROMPT } from "@/lib/team/prompts/deep";

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
    new RegExp(`^${author}カウンセラー[:：]?\\s*`, 'i'),
    new RegExp(`^${author}[:：]?\\s*`),
  ];
  for (const p of patterns) {
    const cleaned = text.replace(p, "").trim();
    if (cleaned !== text) return cleaned;
  }
  return text;
}

// ユーザーメッセージが挨拶のみかどうか判定
function isGreetingOnly(message: string): boolean {
  const greetings = [
    'こんにちは', 'こんばんは', 'おはよう', 'はじめまして',
    'よろしく', 'hello', 'hi', 'hey'
  ];
  const normalized = message.toLowerCase().trim().replace(/[、。！？!?\s]/g, '');
  return greetings.some(g => normalized === g || normalized === g + 'ございます');
}

// 各AIの役割を明確に定義
const AI_ROLES = {
  michele: {
    greeting: "こんにちは。テープ式心理学の専門家です。心の「ガムテープ（思い込み）」を見つけるお手伝いをします。",
    role: "感情の受容と「ガムテープ（心の思い込み）」の特定",
  },
  sato: {
    greeting: "こんにちは。臨床心理学の専門家です。科学的なアプローチで心の問題に向き合います。",
    role: "具体的な対処法と認知再構成の提案",
  },
  adam: {
    greeting: "こんにちは。一般的なAIカウンセラーのアダムです。中立的で実用的なアドバイスを提供します。",
    role: "常識的で実用的なアドバイスと多角的な視点の提供",
  },
  gemini: {
    greeting: "こんにちは。二つの視点で整理するジェミニです。多角的に状況を捉えます。",
    role: "視点の切り替えと選択肢の提示",
  },
  claude: {
    greeting: "こんにちは。思慮深く整理するクロードです。落ち着いて考えていきましょう。",
    role: "価値観の確認と論理的な整理",
  },
  deep: {
    greeting: "こんにちは。詳細に分析するディープです。構造的に状況を見ていきます。",
    role: "要因分析と知識に基づく提案",
  },
};

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
  adam: {
    name: "一般的なAI",
    terms: ["実用的", "多角的", "常識的", "バランス"],
    systemPrompt: ADAM_SYSTEM_PROMPT,
    negativeInstruction: "特定の心理学理論の専門用語（ガムテープ、認知の歪みなど）は使わないでください。一般的でわかりやすい言葉を使ってください。",
  },
  gemini: {
    name: "双視点カウンセリング",
    terms: ["二面性", "多角的", "比較", "柔軟"],
    systemPrompt: GEMINI_SYSTEM_PROMPT,
    negativeInstruction: "専門的な診断名や過度な専門用語は避け、視点の違いを丁寧に説明してください。",
  },
  claude: {
    name: "倫理的カウンセリング",
    terms: ["倫理", "整理", "章立て", "落ち着き"],
    systemPrompt: CLAUDE_SYSTEM_PROMPT,
    negativeInstruction: "派手な演出や断定を避け、静かな語り口を守ってください。",
  },
  deep: {
    name: "分析的カウンセリング",
    terms: ["分析", "要因", "構造化", "探求"],
    systemPrompt: DEEP_SYSTEM_PROMPT,
    negativeInstruction: "専門用語のみで説明せず、平易な言葉と補足を添えてください。",
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

    // ユーザーメッセージが挨拶のみかどうか判定
    const isGreeting = isGreetingOnly(userMessage);

    // 完全独立型：各AIが他のAIの応答を見ずに独立して応答
    for (const p of selected) {
      const spec = AI_SPECIALIZATIONS[p.id.toLowerCase()];
      const role = AI_ROLES[p.id.toLowerCase() as keyof typeof AI_ROLES];
      const { context } = p.ragEnabled ? await searchRagContext(p.id, userMessage, 6) : { context: "" };

      // 挨拶のみの場合：シンプルな自己紹介
      if (isGreeting) {
        const greetingResponse = role?.greeting || "こんにちは。";
        responses.push({ author: p.name, authorId: p.id, content: greetingResponse, iconUrl: p.iconUrl });
        continue;
      }

      // 相談の場合：各AIが独立して専門性を発揮
      const teamInstructions = [
        "\n---\n",
        "## チームカウンセリング指示",
        "",
        `### あなたの役割: ${role?.role || p.specializationName}`,
        spec ? spec.negativeInstruction : "",
        "",
        "### 応答スタイル",
        `- ${p.specializationName}の専門家として独自の視点を提供`,
        "- 他のカウンセラーの応答は気にしない（あなたは独立している）",
        "- ユーザーに直接話しかける",
        "- 150〜300文字程度",
        "- 専門用語を適切に使用",
      ].join("\n");

      // RAGコンテキストの追加
      const ragContext = context
        ? `\n\n## 参考情報（RAG検索結果）\n以下の専門知識を活用して回答してください：\n${context}`
        : "";

      // 完全なシステムプロンプト
      const system = p.systemPrompt + teamInstructions + ragContext;

      // ユーザーとの会話履歴のみ（他のAIの応答は含めない）
      const chatHistory = previousMessages.slice(-6).map((m) => ({ 
        role: m.role, 
        content: m.content 
      }));

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: system },
          ...chatHistory,
          { role: "user", content: userMessage },
        ],
        max_tokens: 600,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content ?? "";
      const sanitized = sanitizeContent(content, p.name);

      responses.push({ author: p.name, authorId: p.id, content: sanitized, iconUrl: p.iconUrl });
    }

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("team respond error", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
