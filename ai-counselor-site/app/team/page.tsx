"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { CheckSquare, Square, Loader2, Send, User } from "lucide-react";

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
  adam: { bubble: "bg-[#f5f5f5]", text: "text-[#374151]", border: "border-[#e5e7eb]" },
  moderator: { bubble: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

export default function TeamCounselingPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>(["michele", "sato"]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoadingSession || isRunning) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    await appendMessages([userMsg]);
    setInput("");
    
    // モバイルでの送信後のキーボード処理
    if (isMobile && textareaRef.current) {
      textareaRef.current.blur();
    }
    
    await runRound(userMsg.content);
  };

  const handleNewChat = async () => {
    if (isRunning || isCreatingSession) return;

    // Validate at least one participant is selected
    if (participants.length === 0) {
      alert("少なくとも1人のAIを選択してください");
      return;
    }

    setIsCreatingSession(true);

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
        alert("新規チャットの作成に失敗しました。もう一度お試しください。");
        return;
      }

      const data = await res.json();
      setSessionId(data.session.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create new chat", error);
      alert("新規チャットの作成に失敗しました。ネットワーク接続を確認してください。");
    } finally {
      setIsCreatingSession(false);
    }
  };

  // モバイル検出とキーボード対応
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    // 初回マウント時、モバイルでテキストエリアをぼかす
    if (window.innerWidth < 768 && textareaRef.current) {
      textareaRef.current.blur();
    }
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // メッセージが追加されたら最下部にスクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
              disabled={isRunning || isCreatingSession}
              className="border-[#f5d0c5]/50 text-xs text-[#6b4423] hover:bg-[#fff9f5]"
            >
              {isCreatingSession ? "作成中..." : "新規チャット"}
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
          <header className="flex items-center justify-between border-b border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-3">
            <span className="font-semibold text-[#6b4423]">チームカウンセリング</span>
            {participants.length > 0 && (
              <span className="text-xs text-[#8b5a3c]">{participants.length}人のAIが参加中</span>
            )}
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-[#8b5a3c]">
                悩みや相談を投稿すると、選択したAIがそれぞれの専門性を活かして応答します。
              </p>
            )}
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex flex-col gap-2 rounded-2xl border border-[#f5d0c5]/30 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a34264]">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-[#6b4423]">あなた</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#6b4423]">{m.content}</p>
                  </div>
                );
              }
              
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
                      {m.author ?? "AI"}
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
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-3" style={{ paddingBottom: isMobile ? "calc(1rem + env(safe-area-inset-bottom))" : "0.75rem" }}>
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="悩みや相談を入力してください"
                className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-[#f5d0c5]/50 bg-white px-3 py-2 text-sm text-[#6b4423] placeholder-[#c9a394] focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={() => {
                  if (isMobile) {
                    setTimeout(() => {
                      if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 300);
                  }
                }}
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isRunning || isLoadingSession}
                className="min-w-[60px] h-[44px] bg-[#d97757] hover:bg-[#c96647] flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
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
            <span className="font-semibold text-[#6b4423]">チームカウンセリング</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChat}
              disabled={isRunning || isCreatingSession}
              className="border-[#f5d0c5]/50 text-xs text-[#6b4423] hover:bg-[#fff9f5]"
            >
              {isCreatingSession ? "..." : "新規"}
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



        {/* Mobile Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-[#8b5a3c]">
                悩みや相談を投稿すると、選択したAIがそれぞれの専門性を活かして応答します。
              </p>
            )}
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex flex-col gap-2 rounded-2xl border border-[#f5d0c5]/30 bg-white px-3 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#a34264]">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-[#6b4423]">あなた</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#6b4423]">{m.content}</p>
                  </div>
                );
              }
              
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
                      {m.author ?? "AI"}
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
            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Input (Fixed) */}
          <div className="border-t border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-3" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="悩みや相談を入力してください"
                className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-[#f5d0c5]/50 bg-white px-3 py-2 text-sm text-[#6b4423] placeholder-[#c9a394] focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={() => {
                  setTimeout(() => {
                    if (messagesEndRef.current) {
                      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 300);
                }}
                autoComplete="off"
                autoCorrect="off"
                enterKeyHint="send"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isRunning || isLoadingSession}
                className="min-w-[60px] h-[44px] bg-[#d97757] hover:bg-[#c96647] flex items-center justify-center"
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
