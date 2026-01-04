import { NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "process";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";

type Participant = {
  id: string;
  name: string;
  iconUrl: string;
  style: string;
};

const PARTICIPANT_PROMPTS: Record<string, string> = {
  michele:
    "あなたはミシェル。テープ式心理学に基づき、温かく感情に寄り添いながらも構造的に整理してあげるカウンセラーです。",
  sato:
    "あなたはドクター・サトウ。臨床心理学を背景に、科学的かつ安全に配慮しながら、具体的な対処方針を提案するカウンセラーです。",
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
        return (
          c && {
            id: c.id,
            name: c.name,
            iconUrl: c.iconUrl,
            style: PARTICIPANT_PROMPTS[c.id] ?? "あなたは専門的なAIカウンセラーです。",
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

    for (const p of selected) {
      const system = [
        "あなたは複数AIが議論するチームカウンセリングの一員です。",
        "ゴールはユーザーの悩みを解決に近づけること。",
        "他のAIの発言を参考にしてもよいが、必ずユーザーの悩みに寄り添い、安全で具体的な提案を返すこと。",
        "回答は200〜400文字程度で簡潔に。",
        p.style,
      ].join("\n");

      const chatHistory = previousMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: `${m.author ? `[${m.author}] ` : ""}${m.content}` }));

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          ...chatHistory,
          { role: "user", content: userMessage },
        ],
        max_tokens: 320,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content ?? "";
      responses.push({ author: p.name, authorId: p.id, content, iconUrl: p.iconUrl });
    }

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("team respond error", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
