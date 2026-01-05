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
        "## チームカウンセリング特別指示（厳守）",
        "",
        "### 【最重要】あなたの専門分野",
        spec ? spec.negativeInstruction : "",
        `**回答の最初の文で必ず「${p.specializationName}では〇〇」という表現を使ってください。**`,
        p.specializationTerms.length > 0
          ? `専門用語を積極的に使用: ${p.specializationTerms.join("、")}`
          : "",
        "",
        "### 【必須】他のカウンセラーへの言及",
        i === 0
          ? [
              "あなたが最初の回答者です。",
              `**必ず「${p.specializationName}の観点からお答えします」と明示してください。**`,
            ].join("\n")
          : [
              "**他のカウンセラーの発言に必ず言及してください。**",
              "例文:",
              `- 「○○さんのおっしゃる通りですね。${p.specializationName}では〜」`,
              `- 「○○さんの意見に加えて、${p.specializationName}の視点から〜」`,
              `- 「○○さんありがとうございます。${p.specializationName}では〜」`,
              "",
              "**前のカウンセラーの具体的な内容に触れながら、あなたの専門分野から新しい視点を加えてください。**",
            ].join("\n"),
        "",
        "### 【禁止】繰り返しの回避",
        i > 0
          ? [
              "**絶対に前のカウンセラーと同じ質問を繰り返さないでください。**",
              "禁止例:",
              "- 前のカウンセラーが「どのような感情ですか？」と聞いた → 同じことを聞かない",
              "- 前のカウンセラーが「どんな思い込みがありますか？」と聞いた → 同じことを聞かない",
              "",
              "**必須: 前のカウンセラーの質問や洞察を受けて、議論を前進させる新しい視点を提供してください。**",
              "良い例:",
              "- 前のカウンセラーが感情について聞いた → あなたは具体的な対処法を提案する",
              "- 前のカウンセラーが原因を探った → あなたは解決策の方向性を示す",
            ].join("\n")
          : "",
        "",
        "### 回答フォーマット（厳守）",
        i === 0
          ? [
              "1行目: 簡潔な共感",
              `2行目: 必ず「${p.specializationName}では〇〇」で始める専門的な洞察`,
              "3行目: 具体的な問いかけや提案",
            ].join("\n")
          : [
              "1行目: 前のカウンセラーへの言及（「○○さんの〜」で始める）",
              `2行目: 必ず「${p.specializationName}では〇〇」で新しい視点を追加`,
              "3行目: 具体的な提案や問いかけ",
            ].join("\n"),
        "",
        "### その他",
        "- 回答は150〜400文字",
        "- 本文に自分の名前は書かない",
        "- 過度な挨拶は不要",
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
