"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import {
  CheckSquare,
  Square,
  Loader2,
  Send,
  User,
  Menu,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";

type Participant = { id: string; name: string; iconUrl: string; comingSoon?: boolean };
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  author?: string;
  authorId?: string;
  content: string;
  iconUrl?: string;
};

type TeamSession = {
  id: string;
  title: string | null;
  participants: string[] | null;
  updated_at: string | null;
};

const COLOR_MAP: Record<string, { bubble: string; text: string; border: string }> = {
  michele: { bubble: "bg-[#fff3f8]", text: "text-[#7b364d]", border: "border-[#ffd4e3]" },
  sato: { bubble: "bg-[#eef4ff]", text: "text-[#1d3a8a]", border: "border-[#d7e9ff]" },
  adam: { bubble: "bg-[#ecfdf5]", text: "text-[#065f46]", border: "border-[#a7f3d0]" },
  gemini: { bubble: "bg-[#fdf2ff]", text: "text-[#6b21a8]", border: "border-[#f3e8ff]" },
  claude: { bubble: "bg-[#f4f4f5]", text: "text-[#3f3f46]", border: "border-[#e4e4e7]" },
  deep: { bubble: "bg-[#eefdfd]", text: "text-[#0f766e]", border: "border-[#c5f6f2]" },
  moderator: { bubble: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const ACTIVE_SESSION_STORAGE_KEY = "team-counseling-active-session-id";
const DEFAULT_PARTICIPANTS = ["michele", "sato"] as const;

function formatTimestamp(value?: string | null) {
  if (!value) return "記録なし";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "記録なし";
  return date.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TeamCounselingPage() {
  const [sessions, setSessions] = useState<TeamSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([...DEFAULT_PARTICIPANTS]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSessionsOpen, setIsMobileSessionsOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<{ canUseTeam: boolean } | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const desktopTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableParticipants: Participant[] = useMemo(
    () =>
      FALLBACK_COUNSELORS.map((c) => ({
        id: c.id,
        name: c.name,
        iconUrl: c.iconUrl ?? "",
        comingSoon: Boolean(c.comingSoon),
      })),
    [],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/access/state", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          if (!active) return null;
          setRequiresLogin(true);
          setAccessState(null);
          return null;
        }
        if (!response.ok) throw new Error("access-state-failed");
        return response.json();
      })
      .then((data) => {
        if (!active || !data) return;
        setAccessState({ canUseTeam: Boolean(data.state?.canUseTeam) });
      })
      .catch(() => {
        if (!active) return;
        setAccessState({ canUseTeam: false });
      })
      .finally(() => active && setAccessLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const showBanner = useCallback((message: string) => {
    setBannerMessage(message);
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    bannerTimeoutRef.current = setTimeout(() => setBannerMessage(null), 2200);
  }, []);

  const persistActiveSessionId = useCallback((id: string | null) => {
    if (typeof window === "undefined") return;
    if (id) {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
  }, []);

  const loadMessagesForSession = useCallback(
    async (targetSessionId: string) => {
      setIsLoadingSession(true);
      try {
        const res = await fetch(`/api/team/sessions/${targetSessionId}/messages`);
        if (!res.ok) {
          throw new Error("failed to load messages");
        }
        const data = await res.json();
        const mapped: ChatMessage[] = (data.messages ?? []).map((m: {
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
          author: m.author ?? undefined,
          authorId: m.author_id ?? undefined,
          iconUrl: m.icon_url ?? undefined,
        }));
        setMessages(mapped);
      } catch (error) {
        console.error("Failed to load team messages", error);
        setMessages([]);
        showBanner("メッセージの読み込みに失敗しました");
      } finally {
        setIsLoadingSession(false);
      }
    },
    [showBanner],
  );

  const refreshSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/team/sessions");
      if (res.status === 401) {
        showBanner("ログインが必要です");
        setSessions([]);
        return [];
      }
      if (!res.ok) {
        throw new Error("failed to load sessions");
      }
      const data = await res.json();
      const normalized: TeamSession[] = (data.sessions ?? []).map((session: TeamSession) => ({
        id: session.id,
        title: session.title ?? "チームカウンセリング",
        participants: Array.isArray(session.participants) ? session.participants : [],
        updated_at: session.updated_at ?? null,
      }));
      setSessions(normalized);
      return normalized;
    } catch (error) {
      console.error("Failed to fetch team sessions", error);
      showBanner("履歴の取得に失敗しました");
      setSessions([]);
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, [showBanner]);

  const createSession = useCallback(
    async (participantList: string[], options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setIsCreatingSession(true);
      }

      try {
        const res = await fetch("/api/team/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "チームカウンセリング",
            participants: participantList,
          }),
        });

        if (!res.ok) {
          throw new Error("failed to create session");
        }

        const data = await res.json();
        const session: TeamSession = {
          id: data.session.id,
          title: data.session.title ?? "チームカウンセリング",
          participants: Array.isArray(data.session.participants) ? data.session.participants : participantList,
          updated_at: data.session.updated_at ?? new Date().toISOString(),
        };
        setSessions((prev) => [session, ...prev]);
        return session;
      } catch (error) {
        console.error("Failed to create team session", error);
        if (!silent) {
          showBanner("新規チャットの作成に失敗しました");
        }
        return null;
      } finally {
        if (!silent) {
          setIsCreatingSession(false);
        }
      }
    },
    [showBanner],
  );

  const saveMessages = useCallback(async (targetSessionId: string, newMessages: ChatMessage[]) => {
    if (!targetSessionId || newMessages.length === 0) return;
    try {
      await fetch(`/api/team/sessions/${targetSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            author: m.author ?? null,
            author_id: m.authorId ?? null,
            icon_url: m.iconUrl ?? null,
          })),
        }),
      });
    } catch (error) {
      console.error("Failed to save team messages", error);
    }
  }, []);

  const appendMessages = useCallback(
    async (newMsgs: ChatMessage[], targetSessionId?: string) => {
      setMessages((prev) => [...prev, ...newMsgs]);
      const resolvedId = targetSessionId ?? sessionId;
      if (!resolvedId || newMsgs.length === 0) return;

      await saveMessages(resolvedId, newMsgs);
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === resolvedId);
        if (index === -1) return prev;
        const updated = { ...prev[index], updated_at: new Date().toISOString() };
        const remaining = prev.filter((s) => s.id !== resolvedId);
        return [updated, ...remaining];
      });
    },
    [saveMessages, sessionId],
  );

  const persistSessionParticipants = useCallback(
    async (selected: string[]) => {
      if (!sessionId) return;
      try {
        const res = await fetch(`/api/team/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participants: selected }),
        });
        if (!res.ok) {
          throw new Error("failed to persist participants");
        }
        const data = await res.json();
        if (data.session) {
          setSessions((prev) => {
            const others = prev.filter((s) => s.id !== data.session.id);
            return [data.session, ...others];
          });
        } else {
          setSessions((prev) =>
            prev.map((session) =>
              session.id === sessionId ? { ...session, participants: selected } : session,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to persist participants", error);
        showBanner("参加AIの保存に失敗しました");
      }
    },
    [sessionId, showBanner],
  );

  const runRound = useCallback(
    async (userMessage: string, activeSessionId: string, historySource: ChatMessage[]) => {
      if (participants.length === 0) return;

      const payload = {
        message: userMessage,
        participants,
        history: historySource.slice(-12).map((m) => ({ role: m.role, content: m.content, author: m.author })),
      } satisfies {
        message: string;
        participants: string[];
        history: { role: "user" | "assistant"; content: string; author?: string }[];
      };

      const controller = new AbortController();
      abortRef.current = controller;
      setIsRunning(true);
      setLoadingSeconds(0);
      
      // Start counting seconds
      loadingIntervalRef.current = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
      try {
        const res = await fetch("/api/team/respond", {
          method: "POST",
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("team respond failed");
        }
        const data: { responses?: { author: string; authorId: string; content: string; iconUrl: string }[] } =
          await res.json();
        const newMessages: ChatMessage[] = (data.responses ?? []).map((response, idx) => ({
          id: `assistant-${Date.now()}-${idx}`,
          role: "assistant",
          author: response.author,
          authorId: response.authorId,
          content: response.content,
          iconUrl: response.iconUrl,
        }));
        await appendMessages(newMessages, activeSessionId);
      } catch (error) {
        console.error("team respond error", error);
        showBanner("AIからの応答に失敗しました");
      } finally {
        setIsRunning(false);
        abortRef.current = null;
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
          loadingIntervalRef.current = null;
        }
        setLoadingSeconds(0);
      }
    },
    [appendMessages, participants, showBanner],
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoadingSession || isRunning) return;

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const created = await createSession(
        participants.length > 0 ? participants : [...DEFAULT_PARTICIPANTS],
        { silent: true },
      );
      if (!created) return;
      activeSessionId = created.id;
      setSessionId(created.id);
      persistActiveSessionId(created.id);
      setParticipants(created.participants?.length ? created.participants : [...DEFAULT_PARTICIPANTS]);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const historySeed = [...messages, userMsg];

    await appendMessages([userMsg], activeSessionId);
    setInput("");

    if (isMobile && mobileTextareaRef.current) {
      mobileTextareaRef.current.blur();
    }

    await runRound(trimmed, activeSessionId, historySeed);
  }, [appendMessages, createSession, input, isLoadingSession, isMobile, isRunning, messages, participants, persistActiveSessionId, runRound, sessionId]);

  const handleNewChat = useCallback(async () => {
    if (isRunning || isCreatingSession) return;
    if (participants.length === 0) {
      showBanner("少なくとも1人のAIを選択してください");
      return;
    }

    const newSession = await createSession(participants);
    if (!newSession) return;

    setSessionId(newSession.id);
    persistActiveSessionId(newSession.id);
    setParticipants(newSession.participants?.length ? newSession.participants : participants);
    setMessages([]);
    setIsMobileSessionsOpen(false);
    showBanner("新しいチャットを開始しました");
  }, [createSession, isCreatingSession, isRunning, participants, persistActiveSessionId, showBanner]);

  const handleSessionSelect = useCallback(
    async (session: TeamSession) => {
      if (session.id === sessionId) {
        setIsMobileSessionsOpen(false);
        return;
      }
      setSessionId(session.id);
      persistActiveSessionId(session.id);
      setParticipants(session.participants && session.participants.length > 0 ? session.participants : [...DEFAULT_PARTICIPANTS]);
      setMessages([]);
      await loadMessagesForSession(session.id);
      setIsMobileSessionsOpen(false);
    },
    [loadMessagesForSession, persistActiveSessionId, sessionId],
  );

  const handleDeleteSession = useCallback(
    async (targetId: string) => {
      if (!confirm("このチャット履歴を削除しますか？")) return;
      try {
        const res = await fetch(`/api/team/sessions/${targetId}`, { method: "DELETE" });
        if (!res.ok) {
          throw new Error("failed to delete session");
        }

        const remaining = sessions.filter((s) => s.id !== targetId);
        setSessions(remaining);

        if (sessionId === targetId) {
          if (remaining.length > 0) {
            const next = remaining[0];
            setSessionId(next.id);
            persistActiveSessionId(next.id);
            setParticipants(next.participants && next.participants.length > 0 ? next.participants : [...DEFAULT_PARTICIPANTS]);
            await loadMessagesForSession(next.id);
          } else {
            setSessionId(null);
            persistActiveSessionId(null);
            setMessages([]);
            const created = await createSession([...DEFAULT_PARTICIPANTS], { silent: true });
            if (created) {
              setSessionId(created.id);
              persistActiveSessionId(created.id);
              setParticipants(created.participants?.length ? created.participants : [...DEFAULT_PARTICIPANTS]);
              await loadMessagesForSession(created.id);
            }
          }
        }
        showBanner("チャットを削除しました");
      } catch (error) {
        console.error("Failed to delete team session", error);
        showBanner("チャットの削除に失敗しました");
      }
    },
    [createSession, loadMessagesForSession, persistActiveSessionId, sessionId, sessions, showBanner],
  );

  const handleShareConversation = useCallback(async () => {
    if (messages.length === 0) {
      showBanner("コピーできる会話がありません");
      return;
    }

    try {
      const text = messages
        .map((m) => `${m.role === "user" ? "あなた" : m.author ?? "AI"}: ${m.content}`)
        .join("\n\n");
      await navigator.clipboard.writeText(text);
      showBanner("✓ 会話をコピーしました");
    } catch (error) {
      console.error("Failed to copy team chat", error);
      showBanner("コピーに失敗しました");
    }
  }, [messages, showBanner]);

  const toggleParticipant = useCallback(
    (id: string) => {
      setParticipants((prev) => {
        let next: string[];
        if (prev.includes(id)) {
          next = prev.filter((p) => p !== id);
        } else {
          next = [...prev, id];
        }

        if (sessionId) {
          setSessions((prevSessions) =>
            prevSessions.map((session) =>
              session.id === sessionId ? { ...session, participants: next } : session,
            ),
          );
          void persistSessionParticipants(next);
        }

        return next;
      });
    },
    [persistSessionParticipants, sessionId],
  );

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingSession(true);
      const list = await refreshSessions();

      let nextSession: TeamSession | null = null;
      if (typeof window !== "undefined") {
        const storedId = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        nextSession = (list ?? []).find((session) => session.id === storedId) ?? null;
      }

      if (!nextSession && list.length > 0) {
        nextSession = list[0];
      }

      if (!nextSession) {
        const created = await createSession([...DEFAULT_PARTICIPANTS], { silent: true });
        nextSession = created;
      }

      if (nextSession) {
        setSessionId(nextSession.id);
        persistActiveSessionId(nextSession.id);
        setParticipants(nextSession.participants && nextSession.participants.length > 0 ? nextSession.participants : [...DEFAULT_PARTICIPANTS]);
        setMessages([]);
        await loadMessagesForSession(nextSession.id);
      } else {
        setIsLoadingSession(false);
      }
    };

    bootstrap();

    return () => {
      abortRef.current?.abort();
    };
  }, [createSession, loadMessagesForSession, persistActiveSessionId, refreshSessions]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => () => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
  }, []);

  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (requiresLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#fff9f5] via-[#fef5f1] to-[#fef0e9] px-6 text-center">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6b4423]/60">
            Please Sign In
          </p>
          <h1 className="text-3xl font-black text-[#6b4423]">チームカウンセリングを利用するにはログインが必要です</h1>
          <p className="text-[#6b4423]/80">まずはアカウントにサインインし、プラン状態を確認してください。</p>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-[#6b4423] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6b4423]/40 transition hover:bg-[#57351b]"
        >
          ログインする
        </Link>
      </div>
    );
  }

  if (accessState && !accessState.canUseTeam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#fff9f5] via-[#fef5f1] to-[#fef0e9] px-6 text-center">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6b4423]/60">
            Premium Required
          </p>
          <h1 className="text-3xl font-black text-[#6b4423]">チームカウンセリングはプレミアム限定です</h1>
          <p className="text-[#6b4423]/80">
            公式LINEの7日無料トライアル、またはプレミアムプランの決済でご利用いただけます。マイページから切り替えてください。
          </p>
        </div>
        <a
          href="/account"
          className="rounded-full bg-[#6b4423] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6b4423]/40 transition hover:bg-[#57351b]"
        >
          マイページでプランを確認
        </a>
      </div>
    );
  }

  const isBootstrapping = isLoadingSession && !sessionId;
  if (isBootstrapping) {
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
    <div className="min-h-screen bg-[#fffdfa]">
      <div className="mx-auto hidden w-full max-w-7xl px-6 py-10 md:grid md:grid-cols-[320px_1fr] md:gap-6">
        <aside className="hidden md:block">
          <div className="sticky top-6 flex h-[calc(100vh-4rem)] flex-col space-y-4 rounded-3xl border border-[#f5d0c5]/30 bg-white/80 p-5 shadow-xl backdrop-blur-lg">
            <div className="rounded-2xl border border-[#f5d0c5]/40 bg-gradient-to-br from-[#fff9f5] via-[#fff1ec] to-[#ffe9df] p-4 text-[#6b4423]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d97757]">AI Team</p>
              <h2 className="mt-2 text-lg font-bold">多視点AIセッション</h2>
              <p className="mt-1 text-sm text-[#a16446]">お好みのAIを選んで、ひとつの画面で対話と履歴を落ち着いて見渡せます。</p>
            </div>
            <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
              <div className="rounded-2xl border border-[#f5d0c5]/40 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#6b4423]">チャット履歴</p>
                  <span className="text-xs text-[#c08d75]">{sessions.length} 件</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={handleNewChat}
                    disabled={isRunning || isCreatingSession}
                    className="flex-1 gap-1 bg-[#d97757] text-white hover:bg-[#c96647]"
                  >
                    <Plus className="h-4 w-4" />
                    新規
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShareConversation}
                    disabled={messages.length === 0}
                    className="flex-1 gap-1 border-[#f5d0c5]/60 text-[#6b4423] hover:bg-[#fff4ef]"
                  >
                    <Share2 className="h-4 w-4" />
                    コピー
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingSessions && sessions.length === 0
                  ? Array.from({ length: 3 }).map((_, idx) => (
                      <div key={`session-skeleton-${idx}`} className="h-16 animate-pulse rounded-2xl border border-[#f5d0c5]/30 bg-white/60" />
                    ))
                  : sessions.map((session) => {
                      const isActive = session.id === sessionId;
                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => handleSessionSelect(session)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            isActive
                              ? "border-transparent bg-gradient-to-r from-[#d97757] to-[#f59e78] text-white"
                              : "border-[#f5d0c5]/40 bg-white text-[#6b4423] hover:bg-[#fff4ef]"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{session.title ?? "チームセッション"}</p>
                            <p className={`text-xs ${isActive ? "text-white/80" : "text-[#c08d75]"}`}>
                              {formatTimestamp(session.updated_at)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteSession(session.id);
                            }}
                            className={`rounded-full p-1 transition ${isActive ? "text-white/80 hover:bg-white/20" : "text-[#c08d75] hover:bg-[#fff4ef]"}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </button>
                      );
                    })}
                {sessions.length === 0 && !isLoadingSessions && (
                  <p className="rounded-2xl border border-dashed border-[#f5d0c5]/60 bg-white/70 px-4 py-6 text-center text-xs text-[#8b5a3c]">
                    履歴がありません。新しいチャットを開始してください。
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-[#f5d0c5]/40 bg-white/80 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#6b4423]">参加AI</p>
                  <span className="text-xs text-[#c08d75]">{participants.length} 名選択中</span>
                </div>
                <div className="space-y-2">
                  {availableParticipants.map((p) => {
                    const checked = participants.includes(p.id);
                    const isDisabled = Boolean(p.comingSoon);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) return;
                          toggleParticipant(p.id);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border border-[#f5d0c5]/40 px-3 py-2 text-left transition ${
                          isDisabled ? "cursor-not-allowed bg-[#fdf7f3] opacity-60" : "bg-white hover:bg-[#fff4ef]"
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="h-4 w-4 text-[#d97757]" />
                        ) : (
                          <Square className="h-4 w-4 text-[#c9a394]" />
                        )}
                        <div className="flex flex-1 items-center justify-between text-sm text-[#6b4423]">
                          <span>{p.name}</span>
                          {isDisabled && (
                            <span className="text-xs font-medium text-[#c08d75]">準備中</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex h-[calc(100vh-4rem)] flex-col rounded-3xl border border-[#f5d0c5]/30 bg-white/85 shadow-xl backdrop-blur-lg">
          <header className="flex flex-col gap-3 border-b border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d97757]">Now Talking</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl font-bold text-[#6b4423]">チームカウンセリング</h1>
                {participants.length > 0 && (
                  <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-xs font-semibold text-[#a16446]">
                    {participants.length} 人のAIが参加中
                  </span>
                )}
              </div>
              <p className="text-sm text-[#a16446]">広いレイアウトでAIチームの会話を並べて読めるので、意見の違いがひと目で分かります。</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleShareConversation}
                variant="outline"
                disabled={messages.length === 0}
                className="gap-1 border-[#f5d0c5]/60 text-[#6b4423] hover:bg-[#fff4ef]"
              >
                <Share2 className="h-4 w-4" /> コピー
              </Button>
              <Button
                onClick={handleNewChat}
                disabled={isRunning || isCreatingSession}
                className="gap-1 bg-[#d97757] text-white hover:bg-[#c96647]"
              >
                <Plus className="h-4 w-4" /> 新規
              </Button>
            </div>
          </header>

          {bannerMessage && (
            <div className="mx-6 mt-4 rounded-2xl border border-[#f5d0c5]/40 bg-white px-4 py-2 text-center text-sm text-[#6b4423] shadow-sm">
              {bannerMessage}
            </div>
          )}

          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-6 py-6">
            {isLoadingSession && sessionId ? (
              <div className="flex items-center justify-center gap-2 text-sm text-[#8b5a3c]">
                <Loader2 className="h-4 w-4 animate-spin" /> 履歴を読み込んでいます...
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-[#8b5a3c]">
                悩みや相談を投稿すると、選択したAIがそれぞれの専門性を活かして応答します。
              </p>
            ) : null}

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
                    <span className={`text-xs font-semibold ${color.text}`}>{m.author ?? "AI"}</span>
                  </div>
                  <p className={`whitespace-pre-wrap text-sm leading-relaxed ${color.text}`}>{m.content}</p>
                </div>
              );
            })}

            {isRunning && (
              <div className="flex flex-col items-center gap-2 text-center rounded-2xl border border-[#f5d0c5]/40 bg-white/80 px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-[#8b5a3c]">
                  <Loader2 className="h-4 w-4 animate-spin" /> AI が応答中...
                </div>
                <div className="text-2xl font-bold text-[#d97757] tabular-nums">
                  {loadingSeconds}秒
                </div>
                <p className="text-xs text-[#a16446]">
                  参加AIが多いほど応答に時間がかかります
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div
            className="border-t border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-6 py-4"
            style={{ paddingBottom: isMobile ? "calc(1rem + env(safe-area-inset-bottom))" : "1rem" }}
          >
            <div className="flex gap-2">
              <textarea
                ref={desktopTextareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="悩みや相談を入力してください"
                className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-[#f5d0c5]/50 bg-white px-3 py-2 text-base text-[#6b4423] placeholder-[#c9a394] focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 resize-none md:text-sm"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                onFocus={() => {
                  if (isMobile) {
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 300);
                  }
                }}
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                inputMode="text"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isRunning || isLoadingSession}
                className="flex min-w-[60px] items-center justify-center rounded-xl bg-[#d97757] text-white hover:bg-[#c96647]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="flex min-h-screen flex-col md:hidden">
        <header className="border-b border-[#f5d0c5]/30 bg-white/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSessionsOpen(true)}>
                <Menu className="h-5 w-5 text-[#6b4423]" />
              </Button>
              <span className="font-semibold text-[#6b4423]">チームカウンセリング</span>
            </div>
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

        {bannerMessage && (
          <div className="mx-4 mt-3 rounded-2xl border border-[#f5d0c5]/40 bg-white px-4 py-2 text-center text-sm text-[#6b4423] shadow-sm">
            {bannerMessage}
          </div>
        )}

        <details className="border-b border-[#f5d0c5]/30 bg-white/80 backdrop-blur-sm">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#8b5a3c]">
            参加AI - タップして選択
          </summary>
          <div className="space-y-2 px-4 pb-3">
            {availableParticipants.map((p) => {
              const checked = participants.includes(p.id);
              const isDisabled = Boolean(p.comingSoon);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    toggleParticipant(p.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border border-[#f5d0c5]/30 px-3 py-2 text-left active:bg-[#fff9f5] ${
                    isDisabled ? "cursor-not-allowed bg-[#fdf7f3] opacity-60" : "bg-white"
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="h-4 w-4 text-[#d97757]" />
                  ) : (
                    <Square className="h-4 w-4 text-[#c9a394]" />
                  )}
                  <div className="flex flex-1 items-center justify-between text-sm text-[#6b4423]">
                    <span>{p.name}</span>
                    {isDisabled && <span className="text-xs font-medium text-[#c08d75]">準備中</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </details>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {isLoadingSession && sessionId ? (
              <div className="flex items-center justify-center gap-2 text-sm text-[#8b5a3c]">
                <Loader2 className="h-4 w-4 animate-spin" /> 履歴を読み込んでいます...
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-[#8b5a3c]">
                悩みや相談を投稿すると、選択したAIがそれぞれの専門性を活かして応答します。
              </p>
            ) : null}

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
                    <span className={`text-xs font-semibold ${color.text}`}>{m.author ?? "AI"}</span>
                  </div>
                  <p className={`whitespace-pre-wrap text-sm leading-relaxed ${color.text}`}>{m.content}</p>
                </div>
              );
            })}

            {isRunning && (
              <div className="flex flex-col items-center gap-2 text-center rounded-2xl border border-[#f5d0c5]/40 bg-white/80 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-[#8b5a3c]">
                  <Loader2 className="h-4 w-4 animate-spin" /> AI が応答中...
                </div>
                <div className="text-2xl font-bold text-[#d97757] tabular-nums">
                  {loadingSeconds}秒
                </div>
                <p className="text-xs text-[#a16446]">
                  参加AIが多いほど応答に時間がかかります
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#f5d0c5]/30 bg-gradient-to-r from-[#fff9f5] to-[#fef5f1] px-4 py-3" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <div className="flex gap-2">
              <textarea
                ref={mobileTextareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="悩みや相談を入力してください"
                className="flex-1 min-h-[48px] max-h-32 rounded-xl border border-[#f5d0c5]/50 bg-white px-3 py-2 text-base leading-relaxed text-[#6b4423] placeholder-[#c9a394] focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                onFocus={() => {
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }}
                autoComplete="off"
                autoCorrect="off"
                enterKeyHint="send"
                autoCapitalize="off"
                inputMode="text"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isRunning || isLoadingSession}
                className="flex min-w-[60px] items-center justify-center rounded-xl bg-[#d97757] text-white hover:bg-[#c96647]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isMobileSessionsOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileSessionsOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[75vh] rounded-t-[32px] border border-white/40 bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#6b4423]">チャット履歴</p>
              <button
                type="button"
                onClick={() => setIsMobileSessionsOpen(false)}
                className="rounded-full border border-[#f5d0c5]/50 p-1"
              >
                <X className="h-4 w-4 text-[#6b4423]" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleNewChat}
                disabled={isRunning || isCreatingSession}
                className="flex-1 gap-1 bg-[#d97757] text-white hover:bg-[#c96647]"
              >
                <Plus className="h-4 w-4" /> 新規
              </Button>
              <Button
                variant="outline"
                onClick={handleShareConversation}
                disabled={messages.length === 0}
                className="flex-1 gap-1 border-[#f5d0c5]/50 text-[#6b4423] hover:bg-[#fff4ef]"
              >
                <Share2 className="h-4 w-4" /> コピー
              </Button>
            </div>
            <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {sessions.map((session) => {
                const isActive = session.id === sessionId;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSessionSelect(session)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isActive ? "border-transparent bg-[#d97757] text-white" : "border-[#f5d0c5]/40 bg-white text-[#6b4423]"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{session.title ?? "チームセッション"}</p>
                      <p className={`text-xs ${isActive ? "text-white/80" : "text-[#c08d75]"}`}>{formatTimestamp(session.updated_at)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteSession(session.id);
                      }}
                      className={`rounded-full p-1 ${isActive ? "text-white/80" : "text-[#c08d75]"}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>
                );
              })}
              {sessions.length === 0 && (
                <p className="rounded-2xl border border-dashed border-[#f5d0c5]/60 bg-white/70 px-4 py-6 text-center text-xs text-[#8b5a3c]">
                  履歴がありません。新しいチャットを開始してください。
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
