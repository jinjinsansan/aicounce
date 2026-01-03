"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mockConversations = [
  {
    id: "conv-1",
    counselor: "ミシェル",
    preview: "テープノート、今日の気付きを振り返りましょう...",
  },
  {
    id: "conv-2",
    counselor: "臨床心理カウンセラー",
    preview: "睡眠習慣の見直しについて...",
  },
  {
    id: "conv-3",
    counselor: "産業メンタルコーチ",
    preview: "1on1でのコミュニケーション計画を整理...",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col gap-6 rounded-3xl bg-white/70 p-6 shadow-lg lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
          Sessions
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">会話履歴</h3>
      </div>
      <div className="space-y-4">
        {mockConversations.map((conversation) => {
          const href = `/counselor/chat/${conversation.id}`;
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
              <p className="font-semibold">{conversation.counselor}</p>
              <p className="text-xs text-slate-500 line-clamp-2">
                {conversation.preview}
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
