"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { AlertTriangle, MessageSquare, User } from "lucide-react";

type ConversationSummary = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  counselor_id: string;
  users?: { email: string; username: string | null };
  counselors?: { name: string; specialty: string };
};

type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

type ConversationDetail = {
  conversation: ConversationSummary & {
    userEmail: string;
    counselorName: string;
  };
  messages: Message[];
};

function AdminChatsContent() {
  const { session, loading } = useSupabase();
  const searchParams = useSearchParams();
  const userId = searchParams?.get("userId");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!session) return;

    setFetching(true);
    setError(null);
    try {
      const url = userId
        ? `/api/admin/chat-history?userId=${userId}`
        : "/api/admin/chat-history";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("failed");
      const data = await response.json();
      setConversations(data.conversations);
    } catch {
      setError("チャット履歴を取得できませんでした。");
    } finally {
      setFetching(false);
    }
  }, [session, userId]);

  const loadConversationDetail = useCallback(async (convId: string) => {
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/chat-history?conversationId=${convId}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("failed");
      const data = await response.json();
      setSelectedConv(data);
    } catch {
      setError("メッセージ履歴を取得できませんでした。");
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-500">
        セッション確認中...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-500">
        管理画面にアクセスするにはログインが必要です。
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
            Emergency Access
          </p>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">チャット履歴閲覧</h2>
        <p className="mt-1 text-sm text-slate-500">
          緊急対応のため、ユーザーのカウンセリングチャット履歴を閲覧できます。プライバシーに配慮し、必要な場合のみご利用ください。
        </p>
      </div>

      {error && (
        <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        {/* Conversation List */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-900">
              チャット一覧 ({conversations.length})
            </h3>
            {userId && (
              <p className="text-xs text-slate-500">特定ユーザーでフィルタ中</p>
            )}
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {fetching ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                読み込み中...
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                チャット履歴がありません
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => loadConversationDetail(conv.id)}
                    className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 flex-shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {conv.title || "無題のチャット"}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {conv.users?.email || "Unknown"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{conv.counselors?.name || "Unknown"}</span>
                          <span>•</span>
                          <span>{new Date(conv.updated_at).toLocaleDateString("ja-JP")}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          {!selectedConv ? (
            <div className="flex h-full min-h-[400px] items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12" />
                <p className="mt-3 text-sm">チャットを選択してください</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedConv.conversation.title || "無題のチャット"}
                </h3>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>ユーザー: {selectedConv.conversation.userEmail}</span>
                  <span>•</span>
                  <span>カウンセラー: {selectedConv.conversation.counselorName}</span>
                  <span>•</span>
                  <span>
                    {new Date(selectedConv.conversation.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>
              </div>
              <div className="max-h-[600px] space-y-4 overflow-y-auto p-6">
                {selectedConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "ml-auto max-w-[80%] bg-blue-500 text-white"
                        : "mr-auto max-w-[80%] bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p
                      className={`mt-2 text-xs ${
                        msg.role === "user" ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AdminChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-500">
          読み込み中...
        </div>
      }
    >
      <AdminChatsContent />
    </Suspense>
  );
}
