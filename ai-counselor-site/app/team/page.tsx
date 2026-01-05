"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { CheckSquare, Square, Loader2, Pause, Play, Send } from "lucide-react";

type Participant = { id: string; name: string; iconUrl: string };
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  author?: string;
  authorId?: string;
  content: string;
  iconUrl?: string;
};

const COLOR_MAP: Record<string, { bubble: string; text: string; border: string }> = {
  michele: { bubble: "bg-[#fff3f8]", text: "text-[#7b364d]", border: "border-[#ffd4e3]" },
  sato: { bubble: "bg-[#eef4ff]", text: "text-[#1d3a8a]", border: "border-[#d7e9ff]" },
  moderator: { bubble: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const MAX_DEFAULT_ROUNDS = 3;

function isGreetingOnly(text: string) {
  const t = text.trim();
  if (t.length === 0) return true;
  const greetings = ["おはよう", "こんにちは", "こんばんは", "お疲れ", "初めまして", "はじめまして"];
  return t.length <= 12 && greetings.some((g) => t.includes(g));
}

export default function TeamCounselingPage() {
  const [participants, setParticipants] = useState<string[]>(["michele", "sato"]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(MAX_DEFAULT_ROUNDS);
  const [stopRequested, setStopRequested] = useState(false);
  const [autoRoundsLeft, setAutoRoundsLeft] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const availableParticipants: Participant[] = useMemo(
    () => FALLBACK_COUNSELORS.map((c) => ({ id: c.id, name: c.name, iconUrl: c.iconUrl ?? "" })),
    [],
  );

  const toggleParticipant = (id: string) => {
    setParticipants((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, id];
    });
  };

  const appendMessages = (newMsgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...newMsgs]);
  };

  const runRound = async (userMessage?: string) => {
    if (participants.length === 0) return;
    const payload = {
      message: userMessage ?? "",
      participants,
      history: messages.slice(-12).map((m) => ({ role: m.role, content: m.content, author: m.author })),
    } satisfies {
      message: string;
      participants: string[];
      history: { role: "user" | "assistant"; content: string; author?: string }[];
    };

    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);
    try {
      const res = await fetch("/api/team/respond", {
        method: "POST",
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("failed");
      const data: { responses?: { author: string; authorId: string; content: string; iconUrl: string }[] } =
        await res.json();
      // モデレーターの進行コメントを挿入
      const moderatorMsg: ChatMessage = {
        id: `moderator-${Date.now()}`,
        role: "assistant",
        author: "司会",
        authorId: "moderator",
        content: "投稿を確認しました。順番に各カウンセラーの見解を共有します。",
      };
      appendMessages([moderatorMsg]);

      // 順番に表示（見やすさ優先）
      for (let idx = 0; idx < (data.responses || []).length; idx++) {
        const r = (data.responses || [])[idx];
        const msg: ChatMessage = {
          id: `assistant-${Date.now()}-${idx}`,
          role: "assistant",
          author: r.author,
          authorId: r.authorId,
          content: r.content,
          iconUrl: r.iconUrl,
        };
        appendMessages([msg]);
      }
      setRound((r) => r + 1);
      setAutoRoundsLeft((n) => (n > 0 ? n - 1 : 0));
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    appendMessages([userMsg]);
    setInput("");
    setRound(0);
    setMaxRounds(MAX_DEFAULT_ROUNDS);
    setStopRequested(false);
    setAutoRoundsLeft(isGreetingOnly(userMsg.content) ? 0 : MAX_DEFAULT_ROUNDS - 1);
    await runRound(userMsg.content);
  };

  const handleContinue = async () => {
    setStopRequested(false);
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;
    if (!lastUser) return;
    setMaxRounds((m) => m + 1);
    setAutoRoundsLeft((n) => Math.max(n, 1));
    await runRound(lastUser);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setStopRequested(true);
    setMaxRounds((current) => Math.min(current, round));
    setAutoRoundsLeft(0);
  };

  useEffect(() => {
    if (round > 0 && round < maxRounds && autoRoundsLeft > 0 && !isRunning && !stopRequested) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;
      if (lastUser) {
        runRound(lastUser);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-10">
        <aside className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">参加AI（最大5名）</h2>
          <div className="space-y-2">
            {availableParticipants.map((p) => {
              const checked = participants.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                >
                  {checked ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                  <span className="text-sm text-slate-800">{p.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-[70vh] flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">チームカウンセリング</span>
              <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                ラウンド {round}/{maxRounds}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleStop} disabled={!isRunning}>
                <Pause className="mr-1 h-4 w-4" /> 停止
              </Button>
              <Button variant="outline" size="sm" onClick={handleContinue} disabled={isRunning || participants.length === 0}>
                <Play className="mr-1 h-4 w-4" /> 続ける
              </Button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-slate-500">ここに悩みを投稿すると、選択したAIが順番に議論を始めます。</p>
            )}
            {messages.map((m) => {
              const color = COLOR_MAP[m.authorId ?? ""] ?? { bubble: "bg-white", text: "text-slate-800", border: "border-slate-200" };
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 rounded-xl border ${color.border} ${color.bubble} px-3 py-2 shadow-sm`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {m.iconUrl && (
                      <div className="h-6 w-6 overflow-hidden rounded-full border border-slate-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.iconUrl} alt={m.author ?? "AI"} className="h-full w-full object-contain" />
                      </div>
                    )}
                    <span className={`font-semibold ${color.text}`}>
                      {m.author ?? (m.role === "user" ? "あなた" : "AI")}
                    </span>
                  </div>
                  <p className={`text-sm whitespace-pre-wrap ${color.text}`}>{m.content}</p>
                </div>
              );
            })}
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> AI が応答中...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="悩みを投稿するとチームが議論を始めます"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isRunning} className="min-w-[90px]">
                <Send className="mr-1 h-4 w-4" /> 送信
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
