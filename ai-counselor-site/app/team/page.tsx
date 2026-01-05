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
const DEBATE_ROUNDS = 3;

function isGreetingOnly(text: string) {
  const t = text.trim();
  if (t.length === 0) return true;
  const greetings = ["おはよう", "こんにちは", "こんばんは", "お疲れ", "初めまして", "はじめまして"];
  return t.length <= 12 && greetings.some((g) => t.includes(g));
}

export default function TeamCounselingPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>(["michele", "sato"]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(MAX_DEFAULT_ROUNDS);
  const [stopRequested, setStopRequested] = useState(false);
  const [autoRoundsLeft, setAutoRoundsLeft] = useState(0);
  const [debateMode, setDebateMode] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const availableParticipants: Participant[] = useMemo(
    () => FALLBACK_COUNSELORS.map((c) => ({ id: c.id, name: c.name, iconUrl: c.iconUrl ?? "" })),
    [],
  );

  // Initialize session and load history
  useEffect(() => {
    const initSession = async () => {
      try {
        // Try to load the most recent session first
        const sessionsRes = await fetch("/api/team/sessions");
        let currentSessionId: string | null = null;

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          if (sessionsData.sessions && sessionsData.sessions.length > 0) {
            // Use the most recent session
            currentSessionId = sessionsData.sessions[0].id;
            setSessionId(currentSessionId);

            // Load messages from existing session
            const messagesRes = await fetch(`/api/team/sessions/${currentSessionId}/messages`);
            if (messagesRes.ok) {
              const messagesData = await messagesRes.json();
              if (messagesData.messages && messagesData.messages.length > 0) {
                setMessages(
                  messagesData.messages.map((m: {
                    id: string;
                    role: "user" | "assistant";
                    content: string;
                    author?: string;
                    author_id?: string;
                    icon_url?: string;
                  }) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    author: m.author,
                    authorId: m.author_id,
                    iconUrl: m.icon_url,
                  }))
                );
              }
            }
          }
        }

        // Create a new session only if none exist
        if (!currentSessionId) {
          const res = await fetch("/api/team/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "チームカウンセリング",
              participants: ["michele", "sato"],
            }),
          });

          if (!res.ok) {
            console.error("Failed to create session");
            return;
          }

          const data = await res.json();
          setSessionId(data.session.id);
        }
      } catch (error) {
        console.error("Failed to initialize session", error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSession();
  }, []);

  // Save messages to database
  const saveMessages = async (newMessages: ChatMessage[]) => {
    if (!sessionId || newMessages.length === 0) return;

    try {
      await fetch(`/api/team/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            author: m.author,
            author_id: m.authorId,
            icon_url: m.iconUrl,
          })),
        }),
      });
    } catch (error) {
      console.error("Failed to save messages", error);
    }
  };

  const toggleParticipant = (id: string) => {
    setParticipants((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, id];
    });
  };

  const appendMessages = async (newMsgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...newMsgs]);
    await saveMessages(newMsgs);
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
      // 順番に表示（見やすさ優先）
      const newMessages: ChatMessage[] = [];
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
        newMessages.push(msg);
      }
      await appendMessages(newMessages);
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
    if (!input.trim() || isLoadingSession) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    await appendMessages([userMsg]);
    setInput("");
    setRound(0);
    const rounds = debateMode ? DEBATE_ROUNDS : 1;
    setMaxRounds(rounds);
    setStopRequested(false);
    setAutoRoundsLeft(isGreetingOnly(userMsg.content) ? 0 : Math.max(0, rounds - 1));
    await runRound(userMsg.content);
  };

  const handleContinue = async () => {
    setStopRequested(false);
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;
    if (!lastUser) return;
    setMaxRounds((m) => (debateMode ? m + 1 : 1));
    setAutoRoundsLeft((n) => (debateMode ? Math.max(n, 1) : 0));
    await runRound(lastUser);
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsRunning(false);
    setStopRequested(true);
    setMaxRounds((current) => Math.min(current, round));
    setAutoRoundsLeft(0);
  };

  const handleNewChat = async () => {
    if (isRunning) return;

    try {
      // Create a new session
      const res = await fetch("/api/team/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "チームカウンセリング",
          participants: participants,
        }),
      });

      if (!res.ok) {
        console.error("Failed to create new session");
        return;
      }

      const data = await res.json();
      setSessionId(data.session.id);
      setMessages([]);
      setRound(0);
      setMaxRounds(MAX_DEFAULT_ROUNDS);
      setStopRequested(false);
      setAutoRoundsLeft(0);
    } catch (error) {
      console.error("Failed to create new chat", error);
    }
  };

  useEffect(() => {
    if (round > 0 && round < maxRounds && debateMode && autoRoundsLeft > 0 && !isRunning && !stopRequested) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;
      if (lastUser) {
        runRound(lastUser);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Cleanup: abort ongoing requests on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff9f5] via-[#fef5f1] to-[#fef0e9]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#d97757]" />
          <p className="text-sm text-[#8b5a3c]">セッションを準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] via-[#fef5f1] to-[#fef0e9]">
      {/* Desktop Layout */}
      <div className="mx-auto hidden max-w-6xl gap-6 px-4 py-6 md:flex lg:py-10">
        {/* Sidebar */}
        <aside className="w-full max-w-xs rounded-2xl border border-[#f5d0c5]/30 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#8b5a3c]">参加AI（最大5名）</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChat}
              disabled={isRunning}
              className="border-[#f5d0c5]/50 text-xs text-[#6b4423] hover:bg-[#fff9f5]"
            >
              新規チャット
            </Button>
          </div>
          <div className="space-y-2">
            {availableParticipants.map((p) => {
              const checked = participants.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#f5d0c5]/30 bg-white/60 px-3 py-2 text-left transition-all hover:bg-[#fff9f5] hover:shadow-sm"
                >
                  {checked ? (
                    <CheckSquare className="h-4 w-4 text-[#d97757]" />
                  ) : (
                    <Square className="h-4 w-4 text-[#c9a394]" />
                  )}
                  <span className="text-sm text-[#6b4423]">{p.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Chat */}
        <div className="flex min-h-[75vh] flex-1 flex-col rounded-2xl border border-[#f5d0c5]/30 bg-white/80 shadow-md backdrop-blur-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#6b4423]">チームカウンセリング</span>
              <span className="rounded-full border border-[#f5d0c5]/50 bg-white/60 px-2 py-0.5 text-xs text-[#8b5a3c]">
                ラウンド {round}/{maxRounds}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={debateMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDebateMode((v) => !v)}
                className={debateMode ? "bg-[#d97757] hover:bg-[#c96647]" : ""}
              >
                {debateMode ? "AI同士の議論: ON" : "AI同士の議論: OFF"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={!isRunning}
                className="border-[#f5d0c5]/50 hover:bg-[#fff9f5]"
              >
                <Pause className="mr-1 h-4 w-4" /> 停止
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleContinue}
                disabled={isRunning || participants.length === 0}
                className="border-[#f5d0c5]/50 hover:bg-[#fff9f5]"
              >
                <Play className="mr-1 h-4 w-4" /> 続ける
              </Button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-[#8b5a3c]">
                ここに悩みを投稿すると、選択したAIが順番に議論を始めます。
              </p>
            )}
            {messages.map((m) => {
              const color = COLOR_MAP[m.authorId ?? ""] ?? {
                bubble: "bg-white",
                text: "text-[#6b4423]",
                border: "border-[#f5d0c5]/30",
              };
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-2 rounded-2xl border ${color.border} ${color.bubble} px-4 py-3 shadow-sm`}
                >
                  <div className="flex items-center gap-2">
                    {m.iconUrl && (
                      <div className="h-8 w-8 overflow-hidden rounded-xl border border-[#f5d0c5]/30 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.iconUrl} alt={m.author ?? "AI"} className="h-full w-full object-contain" />
                      </div>
                    )}
                    <span className={`text-xs font-semibold ${color.text}`}>
                      {m.author ?? (m.role === "user" ? "あなた" : "AI")}
                    </span>
                  </div>
                  <p className={`whitespace-pre-wrap text-sm leading-relaxed ${color.text}`}>{m.content}</p>
                </div>
              );
            })}
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-[#8b5a3c]">
                <Loader2 className="h-4 w-4 animate-spin" /> AI が応答中...
              </div>
            )}
          </div>

          <div className="border-t border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="悩みを投稿するとチームが議論を始めます"
                className="flex-1 rounded-xl border border-[#f5d0c5]/50 bg-white px-3 py-2 text-sm text-[#6b4423] placeholder-[#c9a394] focus:outline-none focus:ring-2 focus:ring-[#d97757]/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isRunning}
                className="min-w-[90px] bg-[#d97757] hover:bg-[#c96647]"
              >
                <Send className="mr-1 h-4 w-4" /> 送信
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex min-h-screen flex-col md:hidden">
        {/* Mobile Header */}
        <header className="border-b border-[#f5d0c5]/30 bg-white/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#6b4423]">チームカウンセリング</span>
              <span className="rounded-full border border-[#f5d0c5]/50 bg-[#fff9f5] px-2 py-0.5 text-xs text-[#8b5a3c]">
                ラウンド {round}/{maxRounds}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChat}
              disabled={isRunning}
              className="border-[#f5d0c5]/50 text-xs text-[#6b4423] hover:bg-[#fff9f5]"
            >
              新規
            </Button>
          </div>
        </header>

        {/* Mobile Participants (Collapsible) */}
        <details className="border-b border-[#f5d0c5]/30 bg-white/80 backdrop-blur-sm">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#8b5a3c]">
            参加AI（最大5名）- タップして選択
          </summary>
          <div className="space-y-2 px-4 pb-3">
            {availableParticipants.map((p) => {
              const checked = participants.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#f5d0c5]/30 bg-white px-3 py-2 text-left active:bg-[#fff9f5]"
                >
                  {checked ? (
                    <CheckSquare className="h-4 w-4 text-[#d97757]" />
                  ) : (
                    <Square className="h-4 w-4 text-[#c9a394]" />
                  )}
                  <span className="text-sm text-[#6b4423]">{p.name}</span>
                </button>
              );
            })}
          </div>
        </details>

        {/* Mobile Controls */}
        <div className="flex flex-wrap gap-2 border-b border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-2">
          <Button
            variant={debateMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDebateMode((v) => !v)}
            className={debateMode ? "bg-[#d97757] hover:bg-[#c96647]" : "flex-1"}
          >
            {debateMode ? "議論: ON" : "議論: OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={!isRunning}
            className="border-[#f5d0c5]/50 hover:bg-[#fff9f5]"
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleContinue}
            disabled={isRunning || participants.length === 0}
            className="border-[#f5d0c5]/50 hover:bg-[#fff9f5]"
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-[#8b5a3c]">
                ここに悩みを投稿すると、選択したAIが順番に議論を始めます。
              </p>
            )}
            {messages.map((m) => {
              const color = COLOR_MAP[m.authorId ?? ""] ?? {
                bubble: "bg-white",
                text: "text-[#6b4423]",
                border: "border-[#f5d0c5]/30",
              };
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-2 rounded-2xl border ${color.border} ${color.bubble} px-3 py-3 shadow-sm`}
                >
                  <div className="flex items-center gap-2">
                    {m.iconUrl && (
                      <div className="h-7 w-7 overflow-hidden rounded-lg border border-[#f5d0c5]/30 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.iconUrl} alt={m.author ?? "AI"} className="h-full w-full object-contain" />
                      </div>
                    )}
                    <span className={`text-xs font-semibold ${color.text}`}>
                      {m.author ?? (m.role === "user" ? "あなた" : "AI")}
                    </span>
                  </div>
                  <p className={`whitespace-pre-wrap text-sm leading-relaxed ${color.text}`}>{m.content}</p>
                </div>
              );
            })}
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-[#8b5a3c]">
                <Loader2 className="h-4 w-4 animate-spin" /> AI が応答中...
              </div>
            )}
          </div>

          {/* Mobile Input (Fixed) */}
          <div className="border-t border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="悩みを投稿"
                className="flex-1 rounded-xl border border-[#f5d0c5]/50 bg-white px-3 py-2 text-sm text-[#6b4423] placeholder-[#c9a394] focus:outline-none focus:ring-2 focus:ring-[#d97757]/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                enterKeyHint="send"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isRunning}
                className="bg-[#d97757] hover:bg-[#c96647]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
