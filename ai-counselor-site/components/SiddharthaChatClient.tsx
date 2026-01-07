"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Loader2, Menu, MessageSquare, Plus, Send, Share2, Trash2, User, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { debugLog } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useChatLayout } from "@/hooks/useChatLayout";
import { useChatDevice } from "@/hooks/useChatDevice";
import {
  DEFAULT_PHASE_DETAILS,
  DEFAULT_PHASE_HINTS,
  DEFAULT_PHASE_LABELS,
  getPhaseProgress,
  inferGuidedPhase,
  type GuidedPhase,
} from "@/components/chat/guidance";

type SessionSummary = {
  id: string;
  title: string | null;
  category: string;
  updated_at: string;
};

type MessageItem = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  pending?: boolean;
};

type ConversationListResponse = {
  conversations?: {
    id: string;
    title: string | null;
    updated_at: string;
  }[];
};

type ConversationMessagesResponse = {
  messages?: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
  }[];
};

const ACTIVE_SESSION_STORAGE_KEY = "siddhartha-buddhism-active-session-id";

const initialPrompts = [
  "心が落ち着かない...",
  "人間関係に疲れている",
  "執着から離れたい",
  "苦しみの原因を知りたい",
];

const thinkingMessages = [
  "経典の智慧を探しています...",
  "慈悲の心で受け止めています...",
  "中道を照らしています...",
  "仏の教えに耳を傾けています...",
];

const THINKING_MESSAGE_INTERVAL_MS = 1400;

export function SiddharthaChatClient() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({ sessions: false, messages: false, sending: false });
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [hasInitializedSessions, setHasInitializedSessions] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);

  const [isOffline, setIsOffline] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<GuidedPhase>("explore");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { composerRef, scrollContainerRef, messagesEndRef, scheduleScroll, composerHeight } = useChatLayout();
  const { isMobile, scrollIntoViewOnFocus } = useChatDevice(textareaRef);
  const hasRestoredSessionRef = useRef(false);
  const lastRequestTimeRef = useRef<number>(0);

  const activeSession = useMemo(() => sessions.find((session) => session.id === activeSessionId) ?? null, [
    sessions,
    activeSessionId,
  ]);
  const hasPendingResponse = useMemo(() => messages.some((msg) => msg.pending), [messages]);
  const userMessageCount = useMemo(() => messages.filter((msg) => msg.role === "user").length, [messages]);

  useEffect(() => {
    setCurrentPhase(inferGuidedPhase(userMessageCount));
  }, [userMessageCount]);

  const loadSessions = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, sessions: true }));
    try {
      const res = await fetch("/api/conversations?counselorId=siddhartha");
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = (await res.json()) as ConversationListResponse;
      const allConversations = data.conversations ?? [];
      setSessions(
        allConversations.map((conversation) => ({
          id: conversation.id,
          title: conversation.title || "新しいチャット",
          category: "general",
          updated_at: conversation.updated_at,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading((prev) => ({ ...prev, sessions: false }));
      setHasInitializedSessions(true);
    }
  }, []);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      debugLog("[loadMessages] Starting to load messages for session:", sessionId);
      setIsLoading((prev) => ({ ...prev, messages: true }));
      try {
        const res = await fetch(`/api/conversations/${sessionId}/messages`);
        debugLog("[loadMessages] Response status:", res.status);

        if (res.status === 401) {
          debugLog("[loadMessages] Unauthorized - setting needsAuth");
          setNeedsAuth(true);
          setHasLoadedMessages(true);
          return;
        }
        if (res.status === 404) {
          debugLog("[loadMessages] Session not found - clearing activeSessionId");
          setActiveSessionId(null);
          setHasLoadedMessages(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load messages");

        const data = (await res.json()) as ConversationMessagesResponse;
        const messagesData = data.messages ?? [];
        debugLog("[loadMessages] Received data:", {
          messagesCount: messagesData.length,
          firstMessage: messagesData[0]?.content?.substring(0, 50),
        });

        setMessages(
          messagesData.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
          })),
        );
        setHasLoadedMessages(true);
        debugLog("[loadMessages] Messages state updated with", messagesData.length, "messages");
      } catch (err) {
        console.error("[loadMessages] Error loading messages:", err);
      } finally {
        setIsLoading((prev) => ({ ...prev, messages: false }));
        debugLog("[loadMessages] Loading complete");
      }
    },
    [],
  );

  useEffect(() => {
    debugLog("[Mount] Component mounted");
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const updateStatus = () => {
      if (typeof navigator === "undefined") return;
      setIsOffline(!navigator.onLine);
    };
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  useEffect(() => {
    debugLog("[Sessions] Loading sessions...");
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    debugLog(
      "[Session Restore] Effect triggered - isMounted:",
      isMounted,
      "hasRestored:",
      hasRestoredSessionRef.current,
      "sessions.length:",
      sessions.length,
      "initialized:",
      hasInitializedSessions,
    );

    if (!isMounted) {
      debugLog("[Session Restore] Skipped - not mounted yet");
      return;
    }
    if (hasRestoredSessionRef.current) {
      debugLog("[Session Restore] Skipped - already restored");
      return;
    }
    if (!hasInitializedSessions) {
      debugLog("[Session Restore] Skipped - sessions not initialized yet");
      return;
    }
    if (sessions.length === 0) {
      debugLog("[Session Restore] No sessions available - finishing restore state");
      hasRestoredSessionRef.current = true;
      setIsRestoringSession(false);
      return;
    }

    try {
      const storedSessionId = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      debugLog("[Session Restore] Stored ID:", storedSessionId, "Sessions count:", sessions.length);

      if (storedSessionId) {
        const exists = sessions.some((s) => s.id === storedSessionId);
        debugLog("[Session Restore] Session exists:", exists);

        if (exists) {
          debugLog("[Session Restore] Restoring session:", storedSessionId);
          setActiveSessionId(storedSessionId);
        } else {
          debugLog("[Session Restore] Session not found in sessions array");
        }
      } else {
        debugLog("[Session Restore] No stored session ID found");
      }
    } catch (error) {
      console.error("[Session Restore] Failed to restore session:", error);
    }

    hasRestoredSessionRef.current = true;
    setIsRestoringSession(false);
    debugLog("[Session Restore] Flag set to true, restoration complete");
  }, [isMounted, sessions, hasInitializedSessions]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  useEffect(() => {
    debugLog("[Save Session] Effect triggered - isMounted:", isMounted, "activeSessionId:", activeSessionId);

    if (!isMounted) {
      debugLog("[Save Session] Skipped - not mounted yet");
      return;
    }

    if (!activeSessionId) {
      debugLog("[Save Session] Skipped - activeSessionId is null (keeping existing localStorage)");
      return;
    }

    try {
      debugLog("[Save Session] Saving to localStorage:", activeSessionId);
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
      debugLog("[Save Session] Saved successfully");
    } catch (error) {
      console.error("[Save Session] Failed to save session:", error);
    }
  }, [isMounted, activeSessionId]);

  useEffect(() => {
    if (isLoading.sending) return;

    debugLog("[Load Messages] activeSessionId:", activeSessionId);

    if (activeSessionId) {
      setHasLoadedMessages(false);
      debugLog("[Load Messages] Loading messages for:", activeSessionId);
      loadMessages(activeSessionId);
    } else {
      debugLog("[Load Messages] Clearing messages (no active session)");
      setMessages([]);
      setHasLoadedMessages(true);
    }
  }, [activeSessionId, isLoading.sending, loadMessages]);

  useLayoutEffect(() => {
    if (messages.length === 0) return;
    scheduleScroll();
  }, [messages.length, scheduleScroll]);

  useEffect(() => {
    if (!hasPendingResponse) return;
    const interval = setInterval(() => {
      setCurrentThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, THINKING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasPendingResponse]);





  const handleNewChat = () => {
    debugLog("[User Action] New chat clicked - clearing session");
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setHasLoadedMessages(true);
    hasRestoredSessionRef.current = false;

    try {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      debugLog("[User Action] localStorage cleared for new chat");
    } catch (error) {
      console.error("[User Action] Failed to clear localStorage:", error);
    }

    if (!isMobile) {
      textareaRef.current?.focus();
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText ? overrideText.trim() : input.trim();

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const MIN_REQUEST_INTERVAL = 3000;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && lastRequestTimeRef.current > 0) {
      const remainingTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      setError(`${remainingTime}秒お待ちください...`);
      setTimeout(() => setError(null), 1000);
      return;
    }

    if (!textToSend || isLoading.sending) {
      return;
    }

    if (hasPendingResponse) {
      debugLog("[Send] Blocked - AI is still responding");
      setError("前の応答を待っています...");
      setTimeout(() => setError(null), 1000);
      return;
    }

    lastRequestTimeRef.current = now;

    if (!overrideText) {
      setInput("");
    }
    setError(null);

    if (isMobile && textareaRef.current) {
      textareaRef.current.blur();
    }

    const tempUserId = `user-${Date.now()}`;
    const tempAiId = `ai-${Date.now()}`;
    const timestamp = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: textToSend, created_at: timestamp },
      { id: tempAiId, role: "assistant", content: "", created_at: timestamp, pending: true },
    ]);

    setIsLoading((prev) => ({ ...prev, sending: true }));

    let hasError = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId: "siddhartha",
          conversationId: activeSessionId ?? undefined,
          message: textToSend,
          useRag: true,
        }),
      });

      if (!res.ok) {
        let serverMessage = "ネットワークエラーが発生しました";

        try {
          const errorBody = (await res.json()) as { error?: string };
          if (errorBody?.error) {
            serverMessage = errorBody.error;
          }
        } catch (parseError) {
          console.error("Failed to parse error response", parseError);
        }
        throw new Error(serverMessage);
      }

      const data = (await res.json()) as {
        conversationId?: string;
        content?: string;
        counselorId?: string;
        tokensUsed?: number;
      };
      const aiContent = data.content ?? "";

      const resolvedConversationId = data.conversationId ?? activeSessionId ?? null;
      if (!activeSessionId && resolvedConversationId) {
        setActiveSessionId(resolvedConversationId);
        loadSessions();
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempAiId ? { ...msg, content: aiContent, pending: false } : msg)),
      );

      if (!activeSessionId && resolvedConversationId) {
        setActiveSessionId(resolvedConversationId);
      }
    } catch (err) {
      hasError = true;
      const friendlyError = err instanceof Error ? err.message : "送信に失敗しました";
      setError(friendlyError);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiId
            ? { ...msg, content: "申し訳ありません。もう一度送ってみてください。", pending: false }
            : msg,
        ),
      );
    } finally {
      if (hasError) {
        setIsLoading((prev) => ({ ...prev, sending: false }));
      } else {
        setTimeout(() => {
          setIsLoading((prev) => ({ ...prev, sending: false }));
        }, 100);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string, event?: MouseEvent) => {
    event?.stopPropagation();
    if (!confirm("このチャット履歴を削除しますか？\n削除後は復元できません。")) return;

    const wasActive = activeSessionId === sessionId;

    try {
      const res = await fetch(`/api/conversations/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      if (wasActive) {
        handleNewChat();
        if (isMobile) {
          setIsSidebarOpen(false);
        }
      }
    } catch (err) {
      console.error("[Delete] Failed to delete session:", err);
      setError("削除に失敗しました。もう一度お試しください。");
      setTimeout(() => setError(null), 1000);
    }
  };

  const handleShare = async () => {
    if (!messages.length) return;
    const text = messages
      .map((m) => `${m.role === "user" ? "あなた" : "シッダールタ"}: ${m.content}`)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setError("✓ 会話内容をコピーしました");
      setTimeout(() => setError(null), 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("コピーに失敗しました");
      setTimeout(() => setError(null), 1000);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!hasPendingResponse) {
        handleSendMessage();
      }
    }
  };

  const cleanContent = (content: string) => {
    let cleaned = content.replace(/【\d+:\d+†.*?】/g, "");
    cleaned = cleaned.replace(/【参考[：:][^】]*】/g, "");
    return cleaned;
  };

  const handleRetryLoad = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }
    loadSessions();
    if (activeSessionId) {
      setHasLoadedMessages(false);
      loadMessages(activeSessionId);
    }
  }, [activeSessionId, loadMessages, loadSessions]);

  if (needsAuth) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-[#fffbf0] via-[#fef8e7] to-[#fef3c7]">
        <div className="rounded-3xl bg-white px-10 py-12 text-center shadow-2xl">
          <p className="text-lg font-semibold text-[#92400e]">ログインが必要です</p>
          <p className="mt-4 text-sm text-[#92400e]">仏教カウンセリングAIをご利用いただくにはログインしてください。</p>
        </div>
      </div>
    );
  }

  const phaseLabels = DEFAULT_PHASE_LABELS;
  const phaseHint = DEFAULT_PHASE_HINTS[currentPhase];
  const phaseDetail = DEFAULT_PHASE_DETAILS[currentPhase];
  const phaseProgress = getPhaseProgress(userMessageCount);
  const phaseProgressPercent = Math.round(phaseProgress * 100);

  const showGlobalLoader =
    !isMounted ||
    isRestoringSession ||
    (messages.length === 0 &&
      !hasLoadedMessages &&
      (isLoading.messages || (isLoading.sessions && sessions.length === 0)));

  if (showGlobalLoader) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-[#fffbf0] via-[#fef8e7] to-[#fef3c7]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#f59e0b]" />
        </div>
      </div>
    );
  }

  const messagePaddingBottom = messages.length === 0 ? 0 : Math.max(composerHeight + 16, 128);
  const showSessionSkeleton = isLoading.sessions && sessions.length === 0;
  const showMessagesSkeleton = isLoading.messages && activeSessionId && messages.length === 0;
  const sessionSkeletonNodes = Array.from({ length: 4 }).map((_, idx) => (
    <div key={`session-skeleton-${idx}`} className="mb-2 h-12 animate-pulse rounded-2xl bg-[#fef3c7]" />
  ));
  const messageSkeletonNodes = (
    <div className="mx-auto max-w-3xl space-y-4" style={{ paddingBottom: `${messagePaddingBottom}px` }}>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={`message-skeleton-${idx}`} className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-[#fde68a]/60" />
          <div className="h-20 flex-1 rounded-2xl bg-white/70 shadow-inner animate-pulse" />
        </div>
      ))}
    </div>
  );
  const newChatButtonBase =
    "w-full justify-center gap-2 rounded-3xl border border-transparent bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-[#f97316]/30 transition-all focus:ring-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#fde68a] hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div
      className="relative flex w-full flex-1 items-stretch bg-gradient-to-br from-[#fffbf0] via-[#fef8e7] to-[#fef3c7] text-[#78350f]"
      style={{
        minHeight: "calc(100vh - 4rem)",
        height: "calc(100vh - 4rem)",
        maxHeight: "calc(100vh - 4rem)",
      }}
    >
      {isOffline && (
        <div className="pointer-events-auto absolute left-1/2 top-4 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold text-yellow-800 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <span>オフラインです。接続が戻り次第自動で再同期します。</span>
            <Button variant="ghost" size="sm" className="text-yellow-800" onClick={handleRetryLoad}>
              再読み込み
            </Button>
          </div>
        </div>
      )}
      <aside
        className="hidden w-[260px] min-w-[260px] flex-col border-r border-[#fde68a] bg-white/90 px-4 py-6 shadow-sm md:flex md:sticky md:top-16 md:self-start md:overflow-y-auto"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <Button
          variant="ghost"
          onClick={handleNewChat}
          disabled={isLoading.sending}
          className={cn("mb-6", newChatButtonBase)}
        >
          <Plus className="h-4 w-4" /> 新しいチャット
        </Button>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#f59e0b]">チャット</p>
        <div className="flex-1 overflow-y-auto">
          {showSessionSkeleton ? (
            <div>{sessionSkeletonNodes}</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  debugLog("[User Action] Desktop: Clicked on session:", session.id);
                  setActiveSessionId(session.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveSessionId(session.id);
                  }
                }}
                className={cn(
                  "group mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                  session.id === activeSessionId
                    ? "border-[#fde68a] bg-[#fef3c7] text-[#78350f]"
                    : "border-transparent bg-transparent text-[#92400e] hover:border-[#fde68a] hover:bg-[#fefce8]",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <div className="min-w-0">
                    <span className="block truncate">{session.title || "新しいチャット"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => handleDeleteSession(session.id, event)}
                  className="rounded-full p-1 text-[#f59e0b] opacity-0 transition group-hover:opacity-100 hover:bg-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          {sessions.length === 0 && !isLoading.sessions && (
            <p className="text-center text-xs text-[#d494ab]">まだチャット履歴がありません。</p>
          )}
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative ml-auto flex h-full w-[80%] max-w-[300px] flex-col border-l border-[#fde68a] bg-white/95 px-4 py-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#92400e]">履歴</span>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
        <Button
          variant="ghost"
          onClick={() => {
            handleNewChat();
            setIsSidebarOpen(false);
          }}
          disabled={isLoading.sending}
          className={cn("mb-4", newChatButtonBase)}
        >
              <Plus className="h-4 w-4" /> 新しいチャット
            </Button>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#f59e0b]">チャット</p>
            <div className="flex-1 overflow-y-auto">
              {showSessionSkeleton ? (
                <div>{sessionSkeletonNodes}</div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      debugLog("[User Action] Mobile: Clicked on session:", session.id);
                      setActiveSessionId(session.id);
                      setIsSidebarOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveSessionId(session.id);
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "group mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                      session.id === activeSessionId
                        ? "border-[#fde68a] bg-[#fef3c7] text-[#78350f]"
                        : "border-transparent bg-transparent text-[#92400e] hover:border-[#fde68a] hover:bg-[#fefce8]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <div className="min-w-0">
                        <span className="block truncate">{session.title || "新しいチャット"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => handleDeleteSession(session.id, event)}
                      className="rounded-full p-1 text-[#f59e0b] transition hover:bg-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
              {sessions.length === 0 && !isLoading.sessions && (
                <p className="text-center text-xs text-[#d494ab]">まだチャット履歴がありません。</p>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white/75 touch-auto overscroll-none">
        <header className="flex flex-col gap-3 border-b border-[#fde68a] px-4 py-3 text-sm text-[#92400e] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-[#fde68a] bg-white text-[#f59e0b] hover:bg-[#fefce8] md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-[#92400e]">{activeSession?.title || "仏教カウンセリングAI"}</span>
            {isLoading.messages && messages.length === 0 && <Loader2 className="h-4 w-4 animate-spin text-[#f59e0b]" />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-semibold text-[#b45309]">
              {phaseLabels[currentPhase]}
            </span>
            <span className="text-xs text-[#92400e]">{phaseHint}</span>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[#92400e]" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> 共有
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2" />
          <div className="flex w-full max-w-xs flex-col">
            <div className="flex items-center justify-between text-[11px] text-[#b45309]">
              <span>フェーズ進捗</span>
              <span>{phaseProgressPercent}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[#fde68a]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(phaseProgressPercent, 100)}%`, backgroundColor: "#d97706" }}
              />
            </div>
            <p className="mt-1 text-[11px] font-semibold text-[#b45309]">{phaseDetail.cta}</p>
          </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-[#fffbf0] to-[#fef8e7]" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="px-4 pt-4">
            {showMessagesSkeleton ? (
              messageSkeletonNodes
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-white shadow-lg">
                  <Image src="/images/counselors/siddhartha.png" alt="Siddhartha" fill className="object-contain" sizes="128px" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#92400e]">合掌、シッダールタです</h2>
                    <p className="mt-2 text-sm text-[#92400e]">心の苦しみ、迷い、すべてをありのままに。</p>
                    <p className="mt-1 text-sm text-[#92400e]">仏の智慧と慈悲で、共に平安の道を歩みましょう。</p>
                  </div>
                </div>

                <div className="grid w-full max-w-xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
                  {initialPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isLoading.sending}
                      className="rounded-xl border border-[#fde68a] bg-white px-6 py-4 text-center text-sm text-[#78350f] shadow-sm transition-all hover:bg-[#fefce8] hover:shadow-md disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6" style={{ paddingBottom: `${messagePaddingBottom}px` }}>
                <div className="rounded-2xl border border-[#fde68a] bg-white/80 px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#b45309]">
                    <span>{phaseDetail.title}</span>
                    <span>{phaseLabels[currentPhase]}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#78350f]">{phaseDetail.summary}</p>
                </div>
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow">
                          <Image src="/images/counselors/siddhartha.png" alt="Siddhartha" fill className="object-contain" sizes="48px" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                          message.role === "user"
                            ? "bg-[#f59e0b] text-white"
                            : "bg-white border border-[#fde68a] text-[#78350f]",
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.pending ? "" : cleanContent(message.content)}
                        </p>
                        {message.pending && (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#f59e0b] [animation-delay:-0.3s]" />
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#f59e0b] [animation-delay:-0.15s]" />
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#f59e0b]" />
                            </div>
                            <p className="text-xs text-[#92400e]">{thinkingMessages[currentThinkingIndex]}</p>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#92400e] shadow">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>


                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div
          ref={composerRef}
          className="sticky bottom-0 left-0 right-0 border-t border-[#fde68a] bg-white/95 px-4 pt-2 z-50"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)",
          }}
        >
          <div className="mx-auto max-w-3xl">
            {error && <p className="mb-2 text-xs font-medium text-[#92400e]">{error}</p>}
            <div className="flex items-end gap-3 rounded-3xl border border-[#fde68a] bg-white/90 px-4 py-3 shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={scrollIntoViewOnFocus}
                placeholder="シッダールタに話しかける..."
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                disabled={isLoading.sending}
                className="max-h-40 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-base leading-relaxed text-[#7b364d] placeholder:text-[#c790a3] focus:outline-none disabled:opacity-60 md:text-sm"
                rows={1}
              />
              <button
                type="button"
                onClick={() => {
                  void handleSendMessage();
                }}
                disabled={isLoading.sending || !input.trim() || hasPendingResponse}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#d97706] text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-[#92400e]">シッダールタAIは誤った情報を生成する場合があります。</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SiddharthaChatClient;
