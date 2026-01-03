"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ConversationLink = {
  id: string;
  counselor_id: string;
  title: string | null;
  updated_at: string | null;
};

const FALLBACK_CONVERSATIONS: ConversationLink[] = [];

interface SidebarProps {
  selectedCounselorId?: string;
  onConversationCreated?: (conversationId: string) => void;
}

function SidebarComponent({
  selectedCounselorId,
  onConversationCreated,
}: SidebarProps) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationLink[]>(
    FALLBACK_CONVERSATIONS,
  );

  const demoUserId =
    process.env.NEXT_PUBLIC_DEMO_USER_ID ??
    process.env.NEXT_PUBLIC_DEFAULT_USER_ID ??
    "00000000-0000-0000-0000-000000000000";

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${demoUserId}`);
      const data = await response.json();
      if (Array.isArray(data.conversations) && data.conversations.length > 0) {
        setConversations((prev) => {
          if (
            prev.length === data.conversations.length &&
            prev.every((conv, index) => conv.id === data.conversations[index].id)
          ) {
            return prev;
          }
          return data.conversations;
        });
      }
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }, [demoUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleCreateConversation = async () => {
    if (!selectedCounselorId) {
      console.warn("selectedCounselorId is required to create conversations");
      return;
    }

    try {
      const response = await fetch(`/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: demoUserId,
          counselorId: selectedCounselorId,
          title: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      if (data?.conversation?.id) {
        await loadConversations();
        onConversationCreated?.(data.conversation.id);
      }
    } catch (error) {
      console.error("Failed to create conversation", error);
    }
  };

  return (
    <aside className="hidden w-64 flex-col gap-6 rounded-3xl bg-white/70 p-6 shadow-lg lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
          Sessions
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">会話履歴</h3>
      </div>
      <div className="space-y-4">
        {conversations.map((conversation) => {
          const href = `/counselor/chat/${conversation.counselor_id}`;
          const isActive = pathname === href;
          return (
            <Link
              key={conversation.id}
              href={href}
              className={
                "block rounded-2xl border px-4 py-3 text-sm transition " +
                (isActive
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-100 bg-white hover:border-blue-100")
              }
            >
              <p className="font-semibold">
                {conversation.title ?? conversation.counselor_id}
              </p>
              <p className="text-xs text-slate-500">
                {conversation.updated_at
                  ? new Date(conversation.updated_at).toLocaleDateString("ja-JP")
                  : ""}
              </p>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleCreateConversation}
        className="rounded-2xl border border-dashed border-blue-300 py-3 text-sm font-semibold text-blue-600"
      >
        新しい会話を開始
      </button>
    </aside>
  );
}

export default memo(SidebarComponent);
