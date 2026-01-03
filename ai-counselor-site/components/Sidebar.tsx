"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ConversationLink = {
  id: string;
  counselor_id: string;
  title: string | null;
  updated_at: string | null;
};

const FALLBACK_CONVERSATIONS: ConversationLink[] = [];

export default function Sidebar() {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationLink[]>(
    FALLBACK_CONVERSATIONS,
  );

  useEffect(() => {
    const load = async () => {
      try {
        const demoUserId =
          process.env.NEXT_PUBLIC_DEMO_USER_ID ??
          process.env.NEXT_PUBLIC_DEFAULT_USER_ID ??
          "00000000-0000-0000-0000-000000000000";
        const response = await fetch(
          `/api/conversations?userId=${demoUserId}`,
        );
        const data = await response.json();
        if (Array.isArray(data.conversations) && data.conversations.length > 0) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error("Failed to load conversations", error);
      }
    };

    load();
  }, []);

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
      <button className="rounded-2xl border border-dashed border-blue-300 py-3 text-sm font-semibold text-blue-600">
        新しい会話を開始
      </button>
    </aside>
  );
}
