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

    // 順次生成：各AIが前のAIの発言を見られるようにする
    for (let i = 0; i < selected.length; i++) {
      const p = selected[i];
      const spec = AI_SPECIALIZATIONS[p.id.toLowerCase()];
      const role = AI_ROLES[p.id.toLowerCase() as keyof typeof AI_ROLES];
      const { context } = p.ragEnabled ? await searchRagContext(p.id, userMessage, 6) : { context: "" };

      // 挨拶のみの場合：シンプルな自己紹介
      if (isGreeting) {
        const greetingResponse = role?.greeting || "こんにちは。";
        responses.push({ author: p.name, authorId: p.id, content: greetingResponse, iconUrl: p.iconUrl });
        continue;
      }

      // 相談の場合：専門性を発揮
      // シンプルな指示 + Few-shot example
      const teamInstructions = i === 0
        ? [
            "\n---\n",
            "## チームカウンセリング指示",
            "",
            `### あなたの役割: ${role?.role || p.specializationName}`,
            spec ? spec.negativeInstruction : "",
            "",
            "### 良い応答の例",
            "",
            "ユーザー: 上司に叱られて苦しいです",
            `${p.name}: お辛い状況ですね。${p.specializationName}では、こうした苦しみの背後に「${p.specializationTerms[0] || "心の問題"}」があると考えます。叱られたとき、どのような感情が湧いてきましたか？`,
            "",
            "### 注意事項",
            "- 常にユーザーに向けて話す（他のカウンセラーに話しかけない）",
            `- 必ず「${p.specializationName}では〇〇」と専門性を明示`,
            "- 150〜300文字程度",
          ].join("\n")
        : [
            "\n---\n",
            "## チームカウンセリング指示",
            "",
            `### あなたの役割: ${role?.role || p.specializationName}`,
            spec ? spec.negativeInstruction : "",
            "",
            "### 良い応答の例",
            "",
            "ユーザー: 上司に叱られて苦しいです",
            "前のカウンセラー: お辛い状況ですね。感情の背後に思い込みがあると考えます。どのような感情が湧いてきましたか？",
            `${p.name}: 前のカウンセラーの視点に加えて、${p.specializationName}の観点からお伝えします。具体的には「${p.specializationTerms[0] || "対処法"}」というアプローチがあります。上司に言われた具体的な言葉を覚えていますか？`,
            "",
            "### 悪い応答の例（絶対にしない）",
            "前のカウンセラー: どのような感情が湧いてきましたか？",
            `${p.name}: どんな感情を感じましたか？ ← 同じ質問の繰り返し`,
            "",
            "### 注意事項",
            "- 常にユーザーに向けて話す",
            "- 前のカウンセラーと同じ質問をしない",
            "- 議論を前進させる新しい視点を提供",
            `- 必ず「${p.specializationName}では〇〇」と専門性を明示`,
            "- 150〜300文字程度",
          ].join("\n");

      // RAGコンテキストの追加
      const ragContext = context
        ? `\n\n## 参考情報（RAG検索結果）\n以下の専門知識を活用して回答してください：\n${context}`
        : "";

      // 完全なシステムプロンプト
      const system = p.systemPrompt + teamInstructions + ragContext;

      // 既存の履歴 + このラウンドで既に生成された他AIの発言
      const chatHistory = [
        ...previousMessages.slice(-6).map((m) => ({ 
          role: m.role, 
          content: m.author ? `${m.author}カウンセラー: ${m.content}` : m.content 
        })),
        ...responses.map((r) => ({ 
          role: "assistant" as const, 
          content: `${r.author}カウンセラー: ${r.content}` 
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
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
