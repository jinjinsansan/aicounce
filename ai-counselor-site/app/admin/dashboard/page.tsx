"use client";

import Link from "next/link";
import { BarChart3, Users, MessageSquare, Activity, Settings, FileText } from "lucide-react";

const menuItems = [
  {
    title: "カウンセラー統計",
    description: "チャット作成回数、人気順",
    href: "/admin/counselors",
    icon: BarChart3,
    color: "bg-blue-500",
  },
  {
    title: "ユーザー一覧",
    description: "登録日、LINE連携、決済状況",
    href: "/admin/users",
    icon: Users,
    color: "bg-emerald-500",
  },
  {
    title: "チャット履歴",
    description: "緊急対応用履歴閲覧",
    href: "/admin/chats",
    icon: MessageSquare,
    color: "bg-purple-500",
  },
  {
    title: "リアルタイム",
    description: "現在のアクティブユーザー",
    href: "/admin/realtime",
    icon: Activity,
    color: "bg-rose-500",
  },
  {
    title: "RAG管理",
    description: "RAGコンテンツアップロード",
    href: "/admin/rag",
    icon: FileText,
    color: "bg-amber-500",
  },
  {
    title: "システム設定",
    description: "キャンペーン、メルマガ配信",
    href: "/admin/settings",
    icon: Settings,
    color: "bg-slate-500",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">管理者パネル</h1>
        <p className="mt-2 text-slate-600">
          システム全体の監視、ユーザー管理、緊急対応機能にアクセスできます。
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg"
            >
              <div className={`inline-flex rounded-2xl ${item.color} p-3 text-white`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-blue-600">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
